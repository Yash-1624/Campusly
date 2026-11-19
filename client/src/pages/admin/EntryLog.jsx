import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
export default function EntryLog() {
    const [entries, setEntries] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        const load = () => api.get("/admin/entries").then(({ data }) => { if (active) { setEntries(data.entries || []); setError(""); } }).catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load entry log."); });
        load(); const timer = setInterval(load, 5000);
        return () => { active = false; clearInterval(timer); };
    }, []);
    if (!entries) return <Loading />;
    return <main className="container"><div className="page-heading"><div><p className="login-eyebrow">LIVE ENTRY MONITOR</p><h1>Participant Entry Log</h1><p className="page-subtitle">Automatically refreshes every five seconds with the volunteer/admin who scanned each ticket.</p></div><span className="status-pill success">{entries.length} entries recorded</span></div>{error && <div className="alert error">{error}</div>}<section className="card table-card"><div className="table-responsive"><table><thead><tr><th>Participant</th><th>Student ID</th><th>Event</th><th>Entry Status</th><th>Entry Time</th><th>Scanned By</th><th>Volunteer ID</th><th>Department</th></tr></thead><tbody>{entries.length ? entries.map((ticket) => <tr key={ticket._id}><td>{ticket.student?.fullName || ticket.studentName}</td><td>{ticket.student?.collegePid || ticket.collegePid}</td><td>{ticket.event?.name || ticket.eventName}</td><td><span className="status-pill success">{ticket.entryStatus}</span></td><td>{ticket.enteredAt ? new Date(ticket.enteredAt).toLocaleString() : "—"}</td><td>{ticket.scannedBy?.fullName || "Unknown"}</td><td>{ticket.scannedBy?.loginId || ticket.scannedBy?.collegePid || "Admin"}</td><td>{ticket.scannedBy?.departmentName || (ticket.scannedBy?.role === "admin" ? "Administration" : "—")}</td></tr>) : <tr><td colSpan="8">No participant entries have been recorded yet.</td></tr>}</tbody></table></div></section></main>;
}
