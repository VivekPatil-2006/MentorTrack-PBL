// backend/api/student-report.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
require('dotenv').config(); // Add this line

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('../firebase-service-account.json'))
});

const db = admin.firestore();

// Get API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateCareerReport = async (studentData) => {
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
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Error generating career report:', error);
    throw error;
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Fetch student data from Firestore
    const studentDoc = await db.collection('students').doc(email).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = studentDoc.data();
    
    // Generate career report using Gemini API
    const careerReport = await generateCareerReport(studentData);
    
    res.json(careerReport);
  } catch (error) {
    console.error('Error generating student report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};