const nodemailer = require("nodemailer");

const {
  SENDER_EMAIL_ADDRESS,
  EMAIL_PASSWORD,
} = process.env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SENDER_EMAIL_ADDRESS,
    pass: EMAIL_PASSWORD,
  },
});

async function sendEmail({ to, subject, text }) {
  if (!SENDER_EMAIL_ADDRESS || !EMAIL_PASSWORD) {
    console.warn("Email credentials are missing. Skipping email send.");
    return;
  }

  await transporter.sendMail({
    from: SENDER_EMAIL_ADDRESS,
    to,
    subject,
    text,
  });
}

module.exports = {
  sendEmail,
};


