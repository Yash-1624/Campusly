
const transporter = require("../config/mail");

// =====================================================
// EMAIL VERIFICATION OTP
// =====================================================
const sendOTPEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Campusly - Email Verification OTP",
    text: `Hello ${name}, your email verification OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h2>Email Verification</h2>
        <p>Hello ${name || "Student"},</p>
        <p>Use the following OTP to verify your email address:</p>
        <h1 style="letter-spacing:6px;color:#5145cd">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};

// Compatibility with authController.js
const sendVerificationOTP = async (email, otp, name = "Student") => {
  return sendOTPEmail(email, name, otp);
};

// =====================================================
// PASSWORD RESET OTP
// =====================================================
const sendPasswordResetEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Campusly - Password Reset OTP",
    text: `Hello ${name}, your password reset OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
        <h2>Password Reset</h2>
        <p>Hello ${name || "Student"},</p>
        <p>Your password reset OTP is:</p>
        <h1 style="letter-spacing:6px;color:#5145cd">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you did not request a password reset, ignore this email.</p>
      </div>
    `,
  });
};

// Compatibility with authController.js
const sendPasswordResetOTP = async (email, otp, name = "Student") => {
  return sendPasswordResetEmail(email, name, otp);
};

// =====================================================
// REGISTRATION CONFIRMATION EMAIL WITH PROFESSIONAL E-TICKET
// The ticket is rendered directly inside Gmail. The QR image is
// attached inline with a CID so it appears in the email body.
// =====================================================
const escapeHtml = (value = "-") => String(value ?? "-")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const formatTicketDate = (value) => {
  if (!value) return "To be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return `${date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })} IST`;
};

const escapeCalendarText = (value = "") => String(value ?? "")
  .replace(/\\/g, "\\\\")
  .replace(/\r?\n/g, "\\n")
  .replace(/,/g, "\\,")
  .replace(/;/g, "\\;");

const toCalendarUtc = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};

const createCalendarInvite = ({ email, studentName, event, registrationCode, ticketCode }) => {
  const start = toCalendarUtc(event?.date);
  if (!start) return null;
  const end = toCalendarUtc(new Date(new Date(event.date).getTime() + 60 * 60 * 1000));
  const now = toCalendarUtc(new Date());
  const sender = process.env.BREVO_SENDER_EMAIL;
  const senderEmail = sender.match(/<([^>]+)>/)?.[1] || sender;
  const description = [
    `Your Campusly registration is confirmed for ${event?.name || "College Event"}.`,
    `Attendee: ${studentName}`,
    `Registration ID: ${registrationCode}`,
    `Ticket ID: ${ticketCode}`,
    "Show the QR ticket attached to your confirmation email at the entrance.",
  ].join("\\n");
  const uid = `${String(ticketCode || registrationCode).replace(/[^a-zA-Z0-9.-]/g, "-")}@campusly`;
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Campusly//Event Confirmation//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "SEQUENCE:0",
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    `SUMMARY:${escapeCalendarText(event?.name || "Campus Event")}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    `LOCATION:${escapeCalendarText(event?.location || "To be announced")}`,
    `ORGANIZER;CN=Campusly:mailto:${senderEmail}`,
    `ATTENDEE;RSVP=TRUE:mailto:${email}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeCalendarText(`Campusly event starts in 30 minutes: ${event?.name || "Campus Event"}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
};

const sendRegistrationConfirmationEmail = async ({
  email,
  student,
  event,
  registration,
  payment,
  ticket,
}) => {
  const studentName = student?.fullName || registration?.studentInformation?.fullName || "Student";
  const collegePid = student?.collegePid || registration?.studentInformation?.collegePid || ticket?.collegePid || "-";
  const eventName = event?.name || ticket?.eventName || "College Event";
  const eventCategory = event?.category || "CAMPUS EVENT";
  const eventDate = formatTicketDate(event?.date);
  const venue = event?.location || "To be announced";
  const registrationCode = registration?.registrationId || "-";
  const ticketCode = ticket?.ticketId || "-";
  const amount = payment?.amount != null ? `₹${Number(payment.amount).toLocaleString("en-IN")}` : "-";
  const paymentStatus = payment?.status || "Successful";
  const qrAvailable = Boolean(ticket?.qrCode);
  const teamDetails = registration?.participation?.type === "Team"
    ? `<tr><td style="padding:7px 0;color:#c8c9f4;font-size:12px;font-weight:700">TEAM</td><td style="padding:7px 0;color:#ffffff;font-size:14px;font-weight:600">${escapeHtml(registration.participation.teamName || "-")}</td></tr>`
    : "";

  const attachments = [];
  if (qrAvailable) {
    const base64Image = ticket.qrCode.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
    attachments.push({
      filename: `${ticketCode}-qr.png`,
      content: Buffer.from(base64Image, "base64"),
      contentType: "image/png",
      cid: "campusly-event-ticket-qr",
      contentDisposition: "inline",
    });
  }

  const calendarInvite = createCalendarInvite({ email, studentName, event, registrationCode, ticketCode });
  if (calendarInvite) {
    attachments.push({
      filename: `${eventName.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "campus-event"}.ics`,
      content: Buffer.from(calendarInvite, "utf8"),
      contentType: "text/calendar; charset=utf-8; method=REQUEST",
      contentDisposition: "attachment",
    });
  }

  const ticketMarkup = qrAvailable
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e4e7f0;border-radius:18px;overflow:hidden">
        <tr>
          <td width="66%" valign="top" style="width:66%;padding:30px 28px;background:#24215f;background-image:linear-gradient(135deg,#17183f,#39319a);color:#ffffff">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:1.2px;font-weight:800;color:#c9c7ff"><span style="display:inline-block;padding:3px 7px;border:1px solid rgba(255,255,255,.35);border-radius:6px;margin-right:7px">✦</span>CAMPUSLY&nbsp;&nbsp; / &nbsp;&nbsp;OFFICIAL EVENT PASS</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1.6px;font-weight:800;color:#bdb8ff;padding-top:17px">${escapeHtml(eventCategory).toUpperCase()}</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;padding:7px 0 19px">${escapeHtml(eventName)}</div>
            <div style="height:1px;background:#7774bd;font-size:1px;line-height:1px">&nbsp;</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px">
              <tr>
                <td width="50%" valign="top" style="padding:8px 8px 18px 0">
                  <div style="font-size:11px;letter-spacing:.7px;color:#c8c9f4;font-weight:800">DATE &amp; TIME</div>
                  <div style="font-size:15px;line-height:1.5;color:#ffffff;font-weight:700;padding-top:5px">${escapeHtml(eventDate)}</div>
                </td>
                <td width="50%" valign="top" style="padding:8px 0 18px 8px">
                  <div style="font-size:11px;letter-spacing:.7px;color:#c8c9f4;font-weight:800">VENUE</div>
                  <div style="font-size:15px;line-height:1.5;color:#ffffff;font-weight:700;padding-top:5px">${escapeHtml(venue)}</div>
                </td>
              </tr>
              <tr>
                <td width="50%" valign="top" style="padding:8px 8px 12px 0">
                  <div style="font-size:11px;letter-spacing:.7px;color:#c8c9f4;font-weight:800">ATTENDEE</div>
                  <div style="font-size:15px;line-height:1.5;color:#ffffff;font-weight:700;padding-top:5px">${escapeHtml(studentName)}</div>
                </td>
                <td width="50%" valign="top" style="padding:8px 0 12px 8px">
                  <div style="font-size:11px;letter-spacing:.7px;color:#c8c9f4;font-weight:800">COLLEGE ID</div>
                  <div style="font-size:15px;line-height:1.5;color:#ffffff;font-weight:700;padding-top:5px">${escapeHtml(collegePid)}</div>
                </td>
              </tr>
              ${teamDetails ? `<tr><td colspan="2">${teamDetails}</td></tr>` : ""}
            </table>
            <div style="padding-top:24px;color:#aaa9d4;font-size:9px;font-weight:800;letter-spacing:1.3px">BOOKING REF&nbsp; <span style="color:#eceaff;letter-spacing:.2px">${escapeHtml(registrationCode)}</span></div>
          </td>
          <td width="34%" valign="top" align="center" style="width:34%;padding:28px 16px;background:#fbfbff;color:#202344;border-left:2px dashed #a6a3dc">
            <div style="font-family:Arial,Helvetica,sans-serif;color:#198754;font-size:12px;font-weight:800;letter-spacing:.6px">VALID FOR ENTRY</div>
            <div style="font-family:Arial,Helvetica,sans-serif;color:#202344;font-size:17px;line-height:1.3;font-weight:800;padding:12px 0 18px">SCAN AT THE ENTRANCE</div>
            <img src="cid:campusly-event-ticket-qr" width="190" height="190" alt="Your event entry QR code" style="display:block;width:190px;max-width:100%;height:auto;margin:0 auto;border:0;background:#ffffff" />
            <div style="font-family:Arial,Helvetica,sans-serif;color:#25264c;font-size:12px;line-height:1.4;font-weight:800;padding-top:18px;word-break:break-word">${escapeHtml(ticketCode)}</div>
            <div style="font-family:Arial,Helvetica,sans-serif;color:#7b8098;font-size:11px;line-height:1.5;padding-top:10px">Keep this pass ready for event check-in.</div>
          </td>
        </tr>
      </table>
      <div style="font-family:Arial,Helvetica,sans-serif;text-align:center;color:#8589a2;font-size:10px;font-weight:700;letter-spacing:.5px;padding:18px 8px 0">CAMPUSLY&nbsp; • &nbsp;GOOD THINGS HAPPEN TOGETHER</div>
    `
    : `<div style="padding:18px;background:#fff2f0;border:1px solid #ffc9c2;border-radius:10px;color:#a51d14;font-family:Arial,sans-serif">Your registration is confirmed, but the QR ticket could not be generated. Please contact the event administrator.</div>`;

  const text = [
    `Hello ${studentName},`,
    qrAvailable
      ? "You're confirmed! Your official Campusly event pass is included below, with the QR ticket attached for entry."
      : "You're confirmed! Your official Campusly event pass is included below. Please contact the event administrator for your QR ticket.",
    calendarInvite ? "Your calendar invite is attached as an .ics file. Open it and save the event to your calendar." : "",
    "We look forward to seeing you there.",
    `Event: ${eventName}`,
    `Date & time: ${eventDate}`,
    `Venue: ${venue}`,
    `Attendee: ${studentName}`,
    `College ID: ${collegePid}`,
    `Registration ID: ${registrationCode}`,
    `Ticket ID: ${ticketCode}`,
    `Payment status: ${paymentStatus}`,
    `Amount: ${amount}`,
    qrAvailable ? "Your QR code is included in this email. Present it at the entrance." : "Your QR ticket is not available yet. Contact the event administrator.",
  ].join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Your Official Event Pass - ${eventName}`,
    text,
    attachments,
    html: `
      <!doctype html>
      <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="margin:0;padding:24px 10px;background:#f2f4fa;font-family:Arial,Helvetica,sans-serif;color:#202344">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:900px;margin:0 auto;border-collapse:collapse">
            <tr><td style="padding:8px 4px 20px;text-align:center">
              <div style="font-size:22px;font-weight:900;letter-spacing:-.5px;color:#5145cd">Campusly</div>
              <div style="font-size:12px;color:#747994;padding-top:5px">EVENT REGISTRATION CONFIRMATION</div>
            </td></tr>
            <tr><td style="padding:0 12px 20px;color:#616b82;font-size:14px;line-height:1.7;text-align:center">
              <strong style="display:block;color:#252a43;font-size:20px;padding-bottom:4px">You’re confirmed, ${escapeHtml(studentName)}!</strong>
              Your official event pass is ready below. ${calendarInvite ? "Save the attached calendar invite." : "The event date will be announced soon."} ${qrAvailable ? "Show your QR code at check-in." : "Contact the event administrator if you need help with your entry pass."}
            </td></tr>
            <tr><td style="padding:0">
              ${ticketMarkup}
            </td></tr>
            <tr><td style="padding:22px 8px 0;color:#6e748b;font-size:12px;line-height:1.7;text-align:center">
              <strong style="color:#303451">Payment:</strong> ${escapeHtml(paymentStatus)} &nbsp; | &nbsp; <strong style="color:#303451">Amount:</strong> ${escapeHtml(amount)}<br>
              ${calendarInvite ? "Your calendar invite is attached as an .ics file. Open it and choose Add to calendar." : ""}<br>
              Please do not share your QR code. Each ticket can be used for entry only once.<br>
              If you need assistance, contact your event administrator.
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
};


// =====================================================
// VOLUNTEER LOGIN CREDENTIALS
// =====================================================
const sendVolunteerCredentialsEmail = async ({ email, name, loginId, password, eventName }) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your Campusly Volunteer Login Credentials",
    text: `Hello ${name},\n\nYour volunteer account has been created.\nLogin page: ${process.env.CLIENT_URL || "http://localhost:5173"}/volunteer-access\nLogin ID: ${loginId}\nTemporary password: ${password}\nAssigned event: ${eventName}\n\nPlease sign in and change your password if password-change functionality is enabled. Do not share these credentials.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;max-width:620px;margin:auto;color:#172033">
        <h2>Your Volunteer Account Is Ready</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>The event administrator has created your volunteer account. Use these temporary credentials to sign in:</p>
        <div style="padding:18px;background:#f4f6fb;border-radius:10px">
          <p><strong>Login ID:</strong> ${loginId}</p>
          <p><strong>Temporary password:</strong> ${password}</p>
          <p><strong>Assigned event:</strong> ${eventName}</p>
        </div>
        <p><a href="${(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")}/volunteer-access" style="display:inline-block;padding:12px 20px;background:#2457d6;color:#fff;text-decoration:none;border-radius:7px">Open Volunteer Login</a></p>
        <p>Keep these credentials private. This temporary password should not be shared with anyone.</p>
        <p>Regards,<br/>Campusly Team</p>
      </div>
    `,
  });
};


// =====================================================
// INDIVIDUAL VOLUNTEER EVENT ALLOCATION EMAIL
// One message is sent for each event assigned to a volunteer.
// =====================================================
const sendVolunteerEventAllocationEmail = async ({ email, name, event }) => {
  const eventDate = event?.date ? new Date(event.date).toLocaleString() : "To be announced";
  const eventName = event?.name || "College Event";
  const eventDescription = event?.description || "Please contact the event administrator for additional instructions.";
  const loginUrl = `${(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")}/volunteer-access`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Volunteer Event Allocation - ${eventName}`,
    text: `Hello ${name},\n\nYou have been allocated as a volunteer for the following event.\nEvent: ${eventName}\nCategory: ${event?.category || "-"}\nDate and time: ${eventDate}\nLocation: ${event?.location || "To be announced"}\nDetails: ${eventDescription}\n\nSign in to the Volunteer Portal: ${loginUrl}\nPlease use the login credentials sent in your separate account-credentials email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;max-width:650px;margin:auto;color:#172033">
        <h2 style="color:#2457d6">Volunteer Event Allocation</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>The administrator has allocated you to the following event as a volunteer.</p>
        <div style="padding:20px;background:#f4f6fb;border-radius:10px">
          <h3 style="margin-top:0">${eventName}</h3>
          <p><strong>Category:</strong> ${event?.category || "-"}</p>
          <p><strong>Date and time:</strong> ${eventDate}</p>
          <p><strong>Location:</strong> ${event?.location || "To be announced"}</p>
          <p><strong>Event details:</strong><br/>${eventDescription}</p>
          <p><strong>Event fee:</strong> ${event?.fee != null ? `₹${event.fee}` : "-"}</p>
        </div>
        <p>Use the credentials from your separate volunteer account email to access your dashboard and assigned event information.</p>
        <p><a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#2457d6;color:#fff;text-decoration:none;border-radius:7px">Open Volunteer Portal</a></p>
        <p>Regards,<br/>Campusly Team</p>
      </div>
    `,
  });
};

module.exports = {
  sendOTPEmail,
  sendVerificationOTP,
  sendPasswordResetEmail,
  sendPasswordResetOTP,
  sendRegistrationConfirmationEmail,
  sendVolunteerCredentialsEmail,
  sendVolunteerEventAllocationEmail,
};
