import { useState } from "react";
import "./TicketPass.css";

const formatDate = (value) => value
    ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "Date to be announced";

const drawWrappedText = (context, value, x, y, maxWidth, lineHeight, maxLines = 2) => {
    const words = String(value || "").split(/\s+/);
    let line = "";
    let lineCount = 0;
    for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (context.measureText(next).width > maxWidth && line) {
            context.fillText(line, x, y + lineCount * lineHeight);
            line = word;
            lineCount += 1;
            if (lineCount >= maxLines) break;
        } else line = next;
    }
    if (lineCount < maxLines && line) context.fillText(line, x, y + lineCount * lineHeight);
};

export default function TicketPass({ ticket, registration, event: eventProp }) {
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");
    const event = eventProp || registration?.event || (typeof ticket?.event === "object" ? ticket.event : null) || {};
    const attendee = registration?.studentInformation || {};
    const eventName = event.name || ticket?.eventName || "Campus event";
    const attendeeName = attendee.fullName || ticket?.studentName || "Student";
    const collegePid = attendee.collegePid || ticket?.collegePid || "—";
    const registrationId = registration?.registrationId || ticket?.registration?.registrationId || "—";
    const used = ticket?.entryStatus === "Entered";

    const downloadTicket = async () => {
        if (!ticket?.qrCode || downloading) return;
        setDownloading(true);
        setDownloadError("");
        try {
            const qrImage = new Image();
            const qrLoaded = new Promise((resolve, reject) => {
                qrImage.onload = resolve;
                qrImage.onerror = () => reject(new Error("Could not load the ticket QR code."));
            });
            qrImage.src = ticket.qrCode;
            await qrLoaded;

            const canvas = document.createElement("canvas");
            canvas.width = 1600;
            canvas.height = 900;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Ticket image download is unavailable in this browser.");

            const background = context.createLinearGradient(0, 0, 1600, 900);
            background.addColorStop(0, "#17183f");
            background.addColorStop(.58, "#322b8a");
            background.addColorStop(1, "#5141c7");
            context.fillStyle = background;
            context.fillRect(0, 0, 1600, 900);
            context.fillStyle = "rgba(132,117,255,.18)";
            context.beginPath(); context.arc(1450, 80, 360, 0, Math.PI * 2); context.fill();
            context.fillStyle = "rgba(68,152,255,.14)";
            context.beginPath(); context.arc(100, 880, 330, 0, Math.PI * 2); context.fill();

            const panelX = 1015;
            context.fillStyle = "#fbfbff";
            context.fillRect(panelX, 0, 585, 900);
            context.save();
            context.setLineDash([13, 14]);
            context.strokeStyle = "#aaa7d0";
            context.lineWidth = 4;
            context.beginPath(); context.moveTo(panelX, 24); context.lineTo(panelX, 876); context.stroke();
            context.restore();
            context.fillStyle = "#fff";
            for (const y of [0, 900]) { context.beginPath(); context.arc(panelX, y, 25, 0, Math.PI * 2); context.fill(); }

            context.textBaseline = "top";
            context.fillStyle = "#c6c1ff";
            context.font = "800 27px Arial";
            context.fillText("CAMPUSLY  /  OFFICIAL EVENT PASS", 90, 75);
            context.fillStyle = "#fff";
            context.font = "800 66px Arial";
            drawWrappedText(context, eventName, 90, 160, 835, 78, 2);

            const lineY = 380;
            context.strokeStyle = "rgba(255,255,255,.25)";
            context.lineWidth = 2;
            context.beginPath(); context.moveTo(90, lineY); context.lineTo(925, lineY); context.stroke();
            const drawMeta = (label, value, x, y, maxWidth = 370) => {
                context.fillStyle = "#bdb8f4";
                context.font = "800 20px Arial";
                context.fillText(label.toUpperCase(), x, y);
                context.fillStyle = "#fff";
                context.font = "600 29px Arial";
                drawWrappedText(context, value, x, y + 34, maxWidth, 36, 2);
            };
            drawMeta("DATE & TIME", formatDate(event.date), 90, 430, 390);
            drawMeta("VENUE", event.location || "To be announced", 540, 430, 385);
            drawMeta("ATTENDEE", attendeeName, 90, 570, 390);
            drawMeta("COLLEGE ID", collegePid, 540, 570, 385);
            context.fillStyle = "#c6c1ff";
            context.font = "700 19px Arial";
            context.fillText(`REGISTRATION  ${registrationId}`, 90, 790);

            context.fillStyle = used ? "#77778e" : "#24865a";
            context.font = "800 20px Arial";
            context.fillText(used ? "ENTRY USED" : "VALID FOR ENTRY", panelX + 62, 65);
            context.fillStyle = "#1e2140";
            context.font = "800 28px Arial";
            context.fillText("SCAN AT THE ENTRANCE", panelX + 62, 118);
            context.fillStyle = "#fff";
            context.fillRect(panelX + 75, 190, 435, 435);
            context.drawImage(qrImage, panelX + 92, 207, 401, 401);
            context.fillStyle = "#26264b";
            context.font = "800 25px Arial";
            context.fillText(ticket.ticketId || "ENTRY TICKET", panelX + 62, 675);
            context.fillStyle = "#777b91";
            context.font = "600 19px Arial";
            context.fillText("Keep this pass ready for event check-in.", panelX + 62, 730);
            context.fillStyle = "#8a8ba1";
            context.font = "700 17px Arial";
            context.fillText("CAMPUSLY  •  GOOD THINGS HAPPEN TOGETHER", panelX + 62, 820);

            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
            if (!blob) throw new Error("The ticket image could not be created.");
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const safeName = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "campus-event";
            link.href = url;
            link.download = `${safeName}-${ticket.ticketId || "ticket"}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            setDownloadError(error.message || "Could not download your ticket.");
        } finally {
            setDownloading(false);
        }
    };

    return <div className="ticket-pass-wrap">
        <article className="real-ticket" aria-label={`Ticket for ${eventName}`}>
            <div className="real-ticket-main">
                <div className="real-ticket-brand"><span className="real-ticket-brand-mark">✦</span><span>CAMPUSLY <i>OFFICIAL EVENT PASS</i></span></div>
                <span className="real-ticket-category">{event.category || "CAMPUS EVENT"}</span>
                <h2>{eventName}</h2>
                <div className="real-ticket-meta-grid">
                    <div><span>DATE & TIME</span><strong>{formatDate(event.date)}</strong></div>
                    <div><span>VENUE</span><strong>{event.location || "To be announced"}</strong></div>
                    <div><span>ATTENDEE</span><strong>{attendeeName}</strong></div>
                    <div><span>COLLEGE ID</span><strong>{collegePid}</strong></div>
                </div>
                <div className="real-ticket-booking"><span>BOOKING REF</span><strong>{registrationId}</strong></div>
            </div>
            <div className="real-ticket-cut" aria-hidden="true"><i /><i /></div>
            <div className="real-ticket-stub">
                <span className={`real-ticket-validity${used ? " used" : ""}`}><i />{used ? "ENTRY USED" : "VALID FOR ENTRY"}</span>
                <span className="real-ticket-scan-label">SCAN AT THE ENTRANCE</span>
                <div className="real-ticket-qr"><img src={ticket.qrCode} alt={`QR code for ticket ${ticket.ticketId}`} /></div>
                <strong className="real-ticket-number">{ticket.ticketId}</strong>
                <span className="real-ticket-hint">Keep this pass ready for event check-in</span>
            </div>
        </article>
        <div className="ticket-pass-actions"><button type="button" className="button primary" onClick={downloadTicket} disabled={downloading}>{downloading ? "Preparing ticket…" : "Download full ticket ↓"}</button>{downloadError && <span role="alert">{downloadError}</span>}</div>
    </div>;
}
