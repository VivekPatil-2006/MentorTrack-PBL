require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ---------- Firebase Admin Initialization ----------
try {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
}

const db = admin.firestore();

// ---------- Gemini AI Initialization ----------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------- Nodemailer setup ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Transporter connection failed:', error);
  } else {
    console.log('✅ Transporter is ready to send emails');
  }
});

// ---------- Google OAuth2 client ----------
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
}

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// ---------- Utility Functions ----------
function extractMeetLink(event) {
  if (event.hangoutLink) return event.hangoutLink;
  if (event.conferenceData && event.conferenceData.entryPoints) {
    const ep = event.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
    if (ep && ep.uri) return ep.uri;
  }
  return null;
}

// Function to process student data (convert string numbers to actual numbers)
const processStudentData = (studentData) => {
  const processedData = { ...studentData };
  
  // Convert string numbers to actual numbers
  const numericFields = ['CGPA', 'backlogs', 'researchPaperPublished', 'hackathonsWin', 'aptitudeScore', 'problemSolved', 'age'];
  
  numericFields.forEach(field => {
    if (processedData[field] !== undefined && processedData[field] !== null) {
      // Convert to number, if conversion fails keep original value
      const numValue = parseFloat(processedData[field]);
      processedData[field] = isNaN(numValue) ? processedData[field] : numValue;
    }
  });
  
  console.log('🔄 Processed student data:', processedData);
  return processedData;
};

// Fallback report generator
const getFallbackReport = (studentData) => {
  console.log('🔄 Generating fallback report');
  return {
    profileId: `${studentData.degree} (${studentData.department}), ${studentData.year}, CGPA ${studentData.CGPA}`,
    strengths: [
      "Academic Excellence", 
      studentData.certifications ? `${studentData.certifications} Certified` : "Technical Certifications",
      studentData.internshipExperience ? "Internship Experience" : "Project Experience",
      studentData.hackathonsWin > 0 ? `${studentData.hackathonsWin} Hackathon Wins` : "Technical Skills"
    ].filter(Boolean),
    focusAreas: [
      studentData.aptitudeScore < 70 ? "Aptitude Test Preparation" : null,
      studentData.communication === "average" ? "Communication Skills" : null,
      "DSA Problem Solving"
    ].filter(Boolean),
    highChanceCompanies: {
      targetRoles: "Specialist, Digital, or Premium tracks",
      companies: ["TCS (Digital/Ninja)", "Infosys (Digital Specialist)", "Wipro (Turbo)", "Capgemini (Innovators)", "Dell Technologies", "Persistent Systems"],
      risk: studentData.aptitudeScore < 70 ? `The Aptitude Score (${studentData.aptitudeScore}) needs improvement to pass initial screening.` : "Focus on technical interview preparation."
    },
    moderateChanceCompanies: {
      targetRoles: "Technology Analyst, Associate SDE, Cloud Developer",
      companies: ["J.P. Morgan Chase & Co.", "Goldman Sachs", "Adobe", "VMware", "Oracle", "Salesforce"],
      preparation: "Focus on System Design and core programming concepts. Highlight your certifications and internship experience."
    },
    lowChanceCompanies: {
      targetRoles: "SDE I, Applied Scientist",
      companies: ["Google", "Microsoft", "Amazon", "Meta", "Tower Research Capital"],
      action: studentData.problemSolved < 400 ? `Increase DSA practice from ${studentData.problemSolved} to 500+ quality problems` : "Focus on advanced system design and competitive programming."
    }
  };
};

// ---------- Student Report API with Gemini ----------
const generateCareerReport = async (studentData) => {
  try {
    console.log('🤖 Calling Gemini API with student data...');
    
    const prompt = `
    Analyze the following student data and generate a career strategy report in JSON format:
    
    Student Data:
    ${JSON.stringify(studentData, null, 2)}
    
    Generate a JSON response with the following structure:
    {
      "profileId": "BE (IT), Final Year, CGPA 9.5",
      "strengths": ["Academic Excellence", "AWS Certified", "2 Internships", "2 Hackathon Wins"],
      "focusAreas": ["DSA Depth", "Aptitude Score", "Communication"],
      "highChanceCompanies": {
        "targetRoles": "Specialist, Digital, or Premium tracks only (avoid mass hiring)",
        "companies": ["TCS (Digital/Ninja)", "Infosys (Digital Specialist)", "Wipro (Turbo)", "Capgemini (Innovators)", "Dell Technologies", "Persistent Systems"],
        "risk": "The low Aptitude Score (65) is the primary barrier. This test must be practiced and passed to secure these interviews."
      },
      "moderateChanceCompanies": {
        "targetRoles": "Technology Analyst, Associate SDE, Cloud Developer",
        "companies": ["J.P. Morgan Chase & Co.", "Goldman Sachs", "Adobe", "VMware", "Oracle", "Salesforce"],
        "preparation": "Focus heavily on System Design and Advanced Java/C++ concepts. Use your AWS Certification and Internships as talking points."
      },
      "lowChanceCompanies": {
        "targetRoles": "SDE I, Applied Scientist, Quant Developer",
        "companies": ["Google", "Microsoft (SDE 1)", "Amazon (SDE I)", "Meta/Facebook", "Tower Research Capital"],
        "action": "The current 300 problems solved is insufficient. Must commit to 500+ quality DSA problems and achieving an Expert-level coding rank to compete."
      }
    }
    
    Please analyze the actual student data provided and adjust the recommendations accordingly.
    Return ONLY valid JSON without any additional text or markdown formatting.
    `;

    // Try different model names
    let model;
    let modelName = "gemini-1.5-flash"; // Use the latest model
    
    try {
      model = genAI.getGenerativeModel({ model: modelName });
      console.log(`✅ Using model: ${modelName}`);
    } catch (error) {
      console.log('❌ gemini-1.5-flash failed, trying gemini-pro...');
      modelName = "gemini-pro";
      model = genAI.getGenerativeModel({ model: modelName });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📄 Raw Gemini API Response:', text);
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully parsed Gemini response');
      return parsedData;
    } else {
      console.error('❌ No JSON found in Gemini response, using fallback');
      return getFallbackReport(studentData);
    }
  } catch (error) {
    console.error('❌ Error in generateCareerReport:', error.message);
    console.log('🔄 Using fallback report due to Gemini error');
    return getFallbackReport(studentData);
  }
};

// ---------- API Routes ----------

// Student Report Endpoint
app.post('/api/student-report', async (req, res) => {
  const { email } = req.body;

  console.log('📨 Received request for email:', email);

  if (!email) {
    console.log('❌ No email provided in request');
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log('🔍 Fetching student data from Firestore for:', email);
    
    // Fetch student data from Firestore
    const studentDoc = await db.collection('students').doc(email).get();
    
    if (!studentDoc.exists) {
      console.log('❌ Student not found in Firestore:', email);
      return res.status(404).json({ error: `Student not found with email: ${email}` });
    }

    const studentData = studentDoc.data();
    console.log('📊 Raw student data from Firestore:', studentData);
    
    // Check if we have the required data
    if (!studentData.degree || !studentData.department) {
      console.log('❌ Missing required fields in student data');
      return res.status(400).json({ error: 'Student data is incomplete' });
    }
    
    // Process the data to convert string numbers to actual numbers
    const processedStudentData = processStudentData(studentData);
    
    console.log('🚀 Calling Gemini API...');
    // Generate career report using Gemini API
    const careerReport = await generateCareerReport(processedStudentData);
    
    console.log('🎯 Career report generated successfully');
    res.json(careerReport);
    
  } catch (error) {
    console.error('❌ Error in student-report endpoint:', error);
    res.status(500).json({ error: 'Failed to generate report. Please try again.' });
  }
});

// Test Firestore connection
app.get('/api/test-firestore', async (req, res) => {
  try {
    const testEmail = req.query.email || 'test@example.com';
    const studentDoc = await db.collection('students').doc(testEmail).get();
    
    if (studentDoc.exists) {
      const rawData = studentDoc.data();
      const processedData = processStudentData(rawData);
      
      res.json({ 
        success: true, 
        message: 'Firestore connected successfully',
        rawData: rawData,
        processedData: processedData
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Firestore connected but no student found with that email',
        data: null 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Firestore connection failed: ' + error.message 
    });
  }
});

// Test Gemini API
app.get('/api/test-gemini', async (req, res) => {
  try {
    // Try the latest model first
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'Gemini API is working!' in a short message");
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      success: true, 
      message: 'Gemini API is working with gemini-1.5-flash',
      response: text 
    });
  } catch (error) {
    console.error('Gemini test failed:', error.message);
    
    // Try alternative model
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent("Say 'Gemini API is working!'");
      const response = await result.response;
      const text = response.text();
      
      res.json({ 
        success: true, 
        message: 'Gemini API is working with gemini-pro',
        response: text 
      });
    } catch (error2) {
      res.status(500).json({ 
        success: false, 
        error: 'Gemini API test failed: ' + error2.message 
      });
    }
  }
});

// ---------- OAuth routes ----------
app.get('/auth/google', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code returned from Google.');

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    if (tokens.refresh_token) {
      const envPath = path.join(__dirname, '.env');
      let envContent = fs.readFileSync(envPath, 'utf-8');

      if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/g, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }

    res.send(`
      <h3>Authorization successful!</h3>
      <p>Your refresh_token has been saved to .env</p>
      <p>You can now restart your server and use Google Meet API.</p>
    `);
  } catch (err) {
    console.error('Error getting tokens:', err);
    res.status(500).send('Failed to get tokens.');
  }
});

// ---------- Test routes ----------
app.get('/test-email', async (req, res) => {
  try {
    const testEmail = process.env.TEST_EMAIL || process.env.GMAIL_USER;
    const info = await transporter.sendMail({
      from: `"Test Email" <${process.env.GMAIL_USER}>`,
      to: testEmail,
      subject: 'Test Email from Mentor Testing',
      text: 'This is a test email to verify transporter settings.',
    });
    console.log('📧 Test email sent:', info.messageId);
    res.send('✅ Test email sent successfully!');
  } catch (err) {
    console.error('❌ Error sending test email:', err);
    res.status(500).send('❌ Failed to send test email');
  }
});

app.get('/test-google', async (req, res) => {
  try {
    const resp = await calendar.calendarList.list();
    res.json({ ok: true, primary: resp.data.items[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- Send credentials route ----------
app.post('/send-email', async (req, res) => {
  const { email, password } = req.body;

  const mailOptions = {
    from: `"Mentor Testing" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your Login Credentials',
    html: `
      <h2>Welcome to Mentor Testing</h2>
      <p>Here are your login credentials:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please keep this information secure.</p>
      <p>Login at: <a href="http://your-portal-url.com">Mentor Testing Portal</a></p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Email sent to ${email} - Message ID: ${info.messageId}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- Create Google Meet & invite ----------
app.post('/create-and-invite', async (req, res) => {
  try {
    const { meeting, teachers } = req.body;
    if (!meeting || !meeting.title || !meeting.date || !meeting.time) {
      return res.status(400).json({ success: false, message: 'Missing meeting data' });
    }

    const organizerEmail = process.env.GMAIL_USER;
    const startDateTime = new Date(`${meeting.date}T${meeting.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + (meeting.duration || 60) * 60000);
    const attendees = (teachers || []).map(t => ({ email: t.email, displayName: t.name || t.email }));
    const requestId = crypto.randomBytes(8).toString('hex');

    const event = {
      summary: meeting.title,
      description: meeting.description || meeting.agenda || '',
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
      attendees,
      conferenceData: {
        createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } }
      }
    };

    const created = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    const meetLink = extractMeetLink(created.data);
    res.json({ success: true, event: created.data, meetLink });
  } catch (err) {
    console.error('Error creating Google Meet event:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Send meeting invites ----------
app.post('/send-meeting-invites', async (req, res) => {
  const { meeting, teachers, meetLink } = req.body;
  try {
    const emails = (teachers || []).map(t => t.email);
    const mailOptions = {
      from: `"Mentor Testing" <${process.env.GMAIL_USER}>`,
      to: emails,
      subject: `Invitation: ${meeting.title}`,
      html: `
        <h3>${meeting.title}</h3>
        <p>${meeting.description || ''}</p>
        <p><strong>Date:</strong> ${meeting.date} <strong>Time:</strong> ${meeting.time}</p>
        <p><strong>Duration:</strong> ${meeting.duration || 60} minutes</p>
        <p><strong>Join via Google Meet:</strong> <a href="${meetLink}">${meetLink}</a></p>
      `
    };
    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, info });
  } catch (err) {
    console.error('Fallback email send failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    services: {
      firebase: !!admin.apps.length,
      gemini: !!process.env.GEMINI_API_KEY,
      gmail: !!process.env.GMAIL_USER
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Student Report API: POST http://localhost:${PORT}/api/student-report`);
  console.log(`🔍 Test Firestore: GET http://localhost:${PORT}/api/test-firestore?email=student@example.com`);
  console.log(`🤖 Test Gemini: GET http://localhost:${PORT}/api/test-gemini`);
  console.log(`❤️ Health Check: GET http://localhost:${PORT}/health`);
  console.log(`🎯 Ready to generate student career reports!`);
});