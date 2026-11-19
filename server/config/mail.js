
const nodemailer = require("nodemailer");

const port = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((error) => {
    if (error) {
        console.error("SMTP connection failed:", error.message);
    } else {
        console.log("SMTP server is ready to send emails.");
    }
});

module.exports = transporter;
