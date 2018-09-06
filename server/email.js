const nodemailer = require('nodemailer');
const config = require('./config');

if (!config.EMAIL.HOST || !config.EMAIL.USERNAME || !config.EMAIL.PASSWORD) {
  console.error('Email SMTP server not configured in environment settings!');
  process.exit();
}

const transporter = nodemailer.createTransport({
  service: config.EMAIL.HOST,
  auth: {
    user: config.EMAIL.USERNAME,
    pass: config.EMAIL.PASSWORD
  }
});

const mailOptions = {
  from: config.EMAIL.USERNAME
};

module.exports = {
  sendMessage: (to, subject, html, callback) => {
    let options = mailOptions;

    options.to = to;
    options.subject = subject;
    options.html = html;

    transporter.sendMail(options, callback);
  }
}
