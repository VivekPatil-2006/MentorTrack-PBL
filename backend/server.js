const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Transporter setup
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

// Test email route
app.get('/test-email', async (req, res) => {
  try {
    const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER;
    const info = await transporter.sendMail({
      from: `"Test Email" <${process.env.EMAIL_USER}>`,
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

// Send credentials route
app.post('/send-email', async (req, res) => {
  const { email, password } = req.body;

  const mailOptions = {
    from: `"Mentor Testing" <${process.env.EMAIL_USER}>`,
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

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
