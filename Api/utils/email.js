const nodemailer = require('nodemailer');

// Configure transporter for Brevo
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.BREVO_EMAIL,      // Your Brevo login email
    pass: process.env.BREVO_SMTP_KEY,   // Your SMTP key from Brevo
  },
});

// Send OTP email
const sendOTPEmail = async ({ to, subject, text }) => {
  console.log('Sending OTP to:', to, 'from', process.env.BREVO_EMAIL);

  const mailOptions = {
    from: process.env.BREVO_EMAIL, // Sender address
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to:', to);
  } catch (err) {
    console.error('Error sending email:', err.message);
    throw err;
  }
};

module.exports = sendOTPEmail;
