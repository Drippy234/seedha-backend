const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create the transporter (The connection to your Gmail)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Define the email content
  const mailOptions = {
    from: `"Seedha Order Team" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Send it!
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;