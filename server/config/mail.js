
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Convert "Campusly <email@example.com>" into an email and name.
const parseSender = (from = "") => {
    const match = String(from).match(/^(.*?)\s*<([^<>]+)>$/);

    if (match) {
        return {
            name: match[1].replace(/^["']|["']$/g, "").trim(),
            email: match[2].trim(),
        };
    }

    return {
        name: process.env.BREVO_SENDER_NAME || "Campusly",
        email: String(from).trim(),
    };
};

// Convert recipients into Brevo's required format.
const formatRecipients = (to) => {
    const recipients = Array.isArray(to) ? to : [to];

    return recipients.map((recipient) => {
        if (typeof recipient === "string") {
            return { email: recipient };
        }

        return {
            email: recipient.address || recipient.email,
            ...(recipient.name ? { name: recipient.name } : {}),
        };
    });
};

// Convert Nodemailer-style attachments into Brevo attachments.
const formatAttachments = (attachments = []) => {
    return attachments.map((attachment) => {
        const content = Buffer.isBuffer(attachment.content)
            ? attachment.content
            : Buffer.from(attachment.content || "");

        return {
            name: attachment.filename || attachment.name || "attachment",
            content: content.toString("base64"),
        };
    });
};

// Brevo does not officially support CID inline images.
// Keep the QR image as a normal downloadable attachment.
const replaceInlineQr = (html = "") => {
    return html.replace(
        /<img\b[^>]*src=["']cid:campusly-event-ticket-qr["'][^>]*\/?>/gi,
        `
      <div style="
        padding:20px;
        margin:10px auto;
        max-width:220px;
        background:#ffffff;
        border:1px dashed #7774bd;
        border-radius:10px;
        text-align:center;
        color:#25264c;
        font-family:Arial,sans-serif;
      ">
        <strong>Your QR ticket is attached to this email.</strong>
        <p style="font-size:12px;color:#7b8098;margin-bottom:0">
          Download the attached PNG image and present it at the entrance.
        </p>
      </div>
    `
    );
};

// Compatible with the existing transporter.sendMail() calls.
const sendMail = async (mailOptions) => {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error("BREVO_API_KEY is missing from environment variables.");
    }

    const configuredEmail = process.env.BREVO_SENDER_EMAIL;
    const parsedSender = parseSender(
        mailOptions.from || process.env.SMTP_FROM || ""
    );

    const senderEmail = configuredEmail || parsedSender.email;
    const senderName =
        process.env.BREVO_SENDER_NAME || parsedSender.name || "Campusly";

    if (!senderEmail) {
        throw new Error("BREVO_SENDER_EMAIL is missing.");
    }

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail,
        },
        to: formatRecipients(mailOptions.to),
        subject: mailOptions.subject,
    };

    if (mailOptions.html) {
        payload.htmlContent = replaceInlineQr(mailOptions.html);
    }

    if (mailOptions.text) {
        payload.textContent = mailOptions.text;
    }

    const attachments = formatAttachments(mailOptions.attachments);

    if (attachments.length > 0) {
        payload.attachment = attachments;
    }

    const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": apiKey,
            "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
    });

    const responseText = await response.text();

    let result = {};

    try {
        result = responseText ? JSON.parse(responseText) : {};
    } catch {
        result = { message: responseText };
    }

    if (!response.ok) {
        console.error("BREVO EMAIL ERROR:", {
            status: response.status,
            response: result,
        });

        throw new Error(
            result.message ||
            result.code ||
            `Brevo email request failed with status ${response.status}`
        );
    }

    console.log("Email sent successfully through Brevo:", result.messageId);

    return {
        messageId: result.messageId,
        response: "Brevo API",
    };
};

module.exports = { sendMail };
