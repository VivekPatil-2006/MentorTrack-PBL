import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, `${Date.now()}-${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Nodemailer setup (Gmail App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vivekjpatil006@gmail.com',
    pass: 'xzsyngtwubonswlg'
  }
});

// ----------------------- Health check -----------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// ----------------------- Marks Upload -----------------------
app.post('/api/upload-marks', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { examType, subjects, email, password } = req.body;
    
    // Validate required fields
    if (!examType || !subjects || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: examType, subjects, email, or password' 
      });
    }

    // Authentication
    if (email !== 'tec@mentorconnect.com' || password !== 'Tec@123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const subjectsArray = JSON.parse(subjects);
    const processedData = [];
    const errors = [];
    let processedCount = 0;
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        processedData.push(row);
      })
      .on('end', async () => {
        try {
          // Process each student record
          for (const row of processedData) {
            const studentEmail = row.email?.trim().toLowerCase();
            
            if (!studentEmail) {
              errors.push('Missing email in row');
              continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(studentEmail)) {
              errors.push(`Invalid email format: ${studentEmail}`);
              continue;
            }

            try {
              const studentMarks = {};
              let hasValidMarks = false;

              // Process each subject mark
              for (const subject of subjectsArray) {
                const mark = row[subject]?.trim();
                
                if (mark && !isNaN(mark) && mark !== '') {
                  const numericMark = parseFloat(mark);
                  if (numericMark >= 0) {
                    studentMarks[subject] = numericMark;
                    hasValidMarks = true;
                  }
                }
              }

              if (!hasValidMarks) {
                errors.push(`No valid marks found for student: ${studentEmail}`);
                continue;
              }

              // Store in students/{email}/exam/{examType} structure
              const studentDocRef = db.collection('students').doc(studentEmail);
              
              // Create or update the student document with exam marks
              await studentDocRef.set({
                email: studentEmail,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
              }, { merge: true });

              // Store exam marks in subcollection: students/{email}/exam/{examType}
              const examRef = studentDocRef.collection('exam').doc(examType);
              await examRef.set({
                ...studentMarks,
                examType: examType,
                uploadedBy: email,
                uploadedAt: admin.firestore.FieldValue.serverTimestamp()
              });

              processedCount++;
              
              console.log(`Successfully uploaded marks for ${studentEmail} in students/${studentEmail}/exam/${examType}`);

            } catch (studentError) {
              console.error(`Error processing student ${studentEmail}:`, studentError);
              errors.push(`Failed to process student: ${studentEmail}`);
            }
          }

          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            processedCount,
            totalRecords: processedData.length,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors.slice(0, 10) : [],
            storagePath: `students/{email}/exam/${examType}`,
            message: `Marks uploaded successfully for ${processedCount} students to students/{email}/exam/${examType}`
          });

        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          res.status(500).json({ error: 'Failed to save data to database' });
        }
      })
      .on('error', (error) => {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Error reading CSV file' });
      });
  } catch (error) {
    console.error('Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process data' });
  }
});

// ----------------------- Get Student Exam Marks -----------------------
app.get('/api/student-marks/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const studentDocRef = db.collection('students').doc(email);
    const examSnapshot = await studentDocRef.collection('exam').get();
    
    const examMarks = {};
    examSnapshot.forEach(doc => {
      examMarks[doc.id] = doc.data();
    });

    res.json({ success: true, data: examMarks });
  } catch (error) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({ error: 'Failed to fetch student marks' });
  }
});

// ----------------------- Placement Upload (UPDATED for your CSV format) -----------------------
app.post('/api/upload-placement', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { email } = req.body;
    const placementData = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        // Map your CSV column names to the database fields
        placementData.push({
          srNo: parseInt(row.SrNo) || 0,
          companyName: row.CompanyName?.trim(),
          criteria: row.Criteria?.trim(),
          condition: row.Condition?.trim(),
          male: parseInt(row.Male) || 0,
          female: parseInt(row.Female) || 0,
          package: parseFloat(row.Package) || 0,
          noOfRounds: parseInt(row.NoOfRound) || 0,
          questionsAsked: parseInt(row.QuestionsAsked) || 0,
          subjectsCovered: row.SubjectsCovered?.trim(),
          skillsRequired: row.SkillsRequired?.trim(),
          suggestion: row.Suggestion?.trim(),
          type: row.Type?.trim(),
          uploadedBy: email,
          uploadedAt: new Date().toISOString(),
          academicYear: '2023-24',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      })
      .on('end', async () => {
        try {
          const batch = db.batch();
          const placementCollection = db.collection('placementReports');
          
          placementData.forEach(company => {
            const docRef = placementCollection.doc();
            batch.set(docRef, { 
              ...company, 
              id: docRef.id
            });
          });
          
          await batch.commit();

          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            processedCount: placementData.length,
            message: `Placement data for ${placementData.length} companies uploaded successfully`
          });
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          res.status(500).json({ error: 'Failed to save placement data' });
        }
      })
      .on('error', (error) => {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Error reading CSV file' });
      });

  } catch (error) {
    console.error('Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process placement data' });
  }
});

// ----------------------- Student Placement/Internship Upload -----------------------
// ----------------------- Student Placement/Internship Upload (UPDATED) -----------------------
app.post('/api/upload-student-placement', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { email: uploaderEmail } = req.body;
    const studentPlacementData = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', row => {
        studentPlacementData.push({
          studentEmail: row['Email']?.trim().toLowerCase(),
          studentName: row['Name']?.trim(),
          department: row['Department']?.trim(),
          studentParentEmail: row['Parent Mail']?.trim().toLowerCase(),
          placementCompany: row['Placement Company']?.trim(),
          placementRole: row['Placement Role']?.trim(),
          placementDate: row['Placement Date']?.trim(),
          internshipCompany: row['Internship Company']?.trim(),
          internshipRole: row['Internship Role']?.trim(),
          internshipStartDate: row['Internship Start Date']?.trim(),
          internshipEndDate: row['Internship End Date']?.trim(),
          internshipStipend: row['Internship Stipend']?.trim()
        });
      })
      .on('end', async () => {
        try {
          let placementCount = 0;
          let internshipCount = 0;
          
          for (const record of studentPlacementData) {
            if (!record.studentEmail) continue;

            const studentDocRef = db.collection('students').doc(record.studentEmail);

            // Create or update student main document
            await studentDocRef.set({
              email: record.studentEmail,
              name: record.studentName,
              department: record.department,
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Store PLACEMENT data in separate subcollection if placement data exists
            if (record.placementCompany && record.placementCompany.trim() !== '') {
              const placementRef = studentDocRef.collection('placementInternship').doc('placement');
              await placementRef.set({
                company: record.placementCompany,
                role: record.placementRole,
                date: record.placementDate,
                uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
                uploadedBy: uploaderEmail
              }, { merge: true });
              placementCount++;
            }

            // Store INTERNSHIP data in separate subcollection if internship data exists
            if (record.internshipCompany && record.internshipCompany.trim() !== '') {
              const internshipRef = studentDocRef.collection('placementInternship').doc('internship');
              await internshipRef.set({
                company: record.internshipCompany,
                role: record.internshipRole,
                startDate: record.internshipStartDate,
                endDate: record.internshipEndDate,
                stipend: record.internshipStipend,
                uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
                uploadedBy: uploaderEmail
              }, { merge: true });
              internshipCount++;
            }

            // Send email notification to parent if email exists
            if (record.studentParentEmail) {
              let emailText = `Dear Parent,\n\nYour child ${record.studentName}'s `;
              
              if (record.placementCompany) {
                emailText += `placement record has been added:\nCompany: ${record.placementCompany}\nRole: ${record.placementRole}\nDate: ${record.placementDate}`;
              }
              
              if (record.internshipCompany) {
                if (record.placementCompany) emailText += '\n\n';
                emailText += `internship record has been added:\nCompany: ${record.internshipCompany}\nRole: ${record.internshipRole}\nPeriod: ${record.internshipStartDate} to ${record.internshipEndDate}\nStipend: ${record.internshipStipend}`;
              }
              
              emailText += `\n\nUploaded by: ${uploaderEmail}\n\nBest regards,\nCollege Placement Cell`;

              const mailOptions = {
                from: 'vivekjpatil006@gmail.com',
                to: record.studentParentEmail,
                subject: 'Placement/Internship Record Added',
                text: emailText
              };

              transporter.sendMail(mailOptions, (err, info) => {
                if (err) console.error(`Failed to send email to ${record.studentParentEmail}:`, err);
                else console.log(`Email sent to ${record.studentParentEmail}: ${info.response}`);
              });
            }
          }

          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

          let message = `Uploaded data for ${studentPlacementData.length} students. `;
          if (placementCount > 0) message += `Placement records: ${placementCount}. `;
          if (internshipCount > 0) message += `Internship records: ${internshipCount}.`;

          res.json({
            success: true,
            processedCount: studentPlacementData.length,
            placementCount,
            internshipCount,
            message: message
          });

        } catch (dbError) {
          console.error('Firestore error:', dbError);
          res.status(500).json({ error: 'Failed to save student placement data' });
        }
      })
      .on('error', err => {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Error reading CSV file' });
      });

  } catch (error) {
    console.error('Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process CSV data' });
  }
});

// ----------------------- Get Placement Data -----------------------
app.get('/api/placement-data', async (req, res) => {
  try {
    const snapshot = await db.collection('placementReports').orderBy('timestamp', 'desc').limit(50).get();
    const placementData = [];
    snapshot.forEach(doc => placementData.push(doc.data()));
    res.json({ success: true, data: placementData, count: placementData.length });
  } catch (error) {
    console.error('Error fetching placement data:', error);
    res.status(500).json({ error: 'Failed to fetch placement data' });
  }
});

// ----------------------- Upcoming Companies -----------------------
app.post('/api/upcoming-companies', async (req, res) => {
  try {
    const { companyName, criteria, type, date, description, email } = req.body;
    if (!companyName || !date) return res.status(400).json({ error: 'Company name and date are required' });

    const docRef = db.collection('upcomingCompanies').doc();
    await docRef.set({
      companyName,
      criteria: criteria || '',
      type: type || '',
      date,
      description: description || '',
      addedBy: email || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'Upcoming company added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add upcoming company' });
  }
});

app.get('/api/upcoming-companies', async (req, res) => {
  try {
    const snapshot = await db.collection('upcomingCompanies').orderBy('date', 'asc').get();
    const companies = [];
    snapshot.forEach(doc => companies.push(doc.data()));
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch upcoming companies' });
  }
});

// ----------------------- Upcoming Events -----------------------
app.post('/api/upcoming-events', async (req, res) => {
  try {
    const { eventName, type, date, description, email } = req.body;
    if (!eventName || !date) return res.status(400).json({ error: 'Event name and date are required' });

    const docRef = db.collection('upcomingEvents').doc();
    await docRef.set({
      eventName,
      type: type || 'General',
      date,
      description: description || '',
      addedBy: email || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'Upcoming event added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add upcoming event' });
  }
});

app.get('/api/upcoming-events', async (req, res) => {
  try {
    const snapshot = await db.collection('upcomingEvents').orderBy('date', 'asc').get();
    const events = [];
    snapshot.forEach(doc => events.push(doc.data()));
    res.json({ success: true, data: events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// ----------------------- Start Server -----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Firestore connected`);
});