import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import AdminStatsBoard from "../../components/AdminStatsBoard";
import AdminPageHero from "../../components/AdminPageHero";
export default function EntryLog() {
    const [entries, setEntries] = useState(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const filteredEntries = useMemo(() => { const query = search.trim().toLowerCase(); return (entries || []).filter((ticket) => !query || [ticket.student?.fullName, ticket.studentName, ticket.student?.collegePid, ticket.collegePid, ticket.event?.name, ticket.eventName, ticket.entryStatus, ticket.scannedBy?.fullName, ticket.scannedBy?.loginId, ticket.scannedBy?.departmentName].some((value) => String(value || "").toLowerCase().includes(query))); }, [entries, search]);
    useEffect(() => {
        let active = true;
        const load = () => api.get("/admin/entries").then(({ data }) => { if (active) { setEntries(Array.isArray(data.entries) ? data.entries.filter((item) => item && typeof item === "object") : []); setError(""); } }).catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load entry log."); });
        load(); const timer = setInterval(load, 5000);
        return () => { active = false; clearInterval(timer); };
    }, []);
    if (!entries) return <Loading />;
    return <main className="container"><AdminPageHero eyebrow="LIVE ENTRY MONITOR" title="Participant Entry Log" description="Automatically refreshes every five seconds with the volunteer or admin who scanned each ticket." aside={<span className="status-pill success">{entries.length} entries recorded</span>} /><AdminStatsBoard items={[
        { label: "Total entries", value: entries.length, note: "Recorded check-ins", icon: "?" },
        { label: "Participants", value: new Set(entries.map((ticket) => ticket.student?.collegePid || ticket.collegePid || ticket.studentName).filter(Boolean)).size, note: "Unique attendees", icon: "?" },
        { label: "Events", value: new Set(entries.map((ticket) => ticket.event?._id || ticket.event?.name || ticket.eventName).filter(Boolean)).size, note: "With recorded entry", icon: "?" },
    ]} />{error && <div className="alert error">{error}</div>}<section className="card table-card"><div className="entry-log-toolbar"><input className="search" type="search" aria-label="Search participant entries" placeholder="Search participant, event, student ID..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>{filteredEntries.length} matching entries</span></div><div className="table-responsive"><table><thead><tr><th>Participant</th><th>Student ID</th><th>Event</th><th>Entry Status</th><th>Entry Time</th><th>Scanned By</th><th>Volunteer ID</th><th>Department</th></tr></thead><tbody>{filteredEntries.length ? filteredEntries.map((ticket) => <tr key={ticket._id}><td>{ticket.student?.fullName || ticket.studentName}</td><td>{ticket.student?.collegePid || ticket.collegePid}</td><td>{ticket.event?.name || ticket.eventName}</td><td><span className="status-pill success">{ticket.entryStatus}</span></td><td>{ticket.enteredAt ? new Date(ticket.enteredAt).toLocaleString() : "—"}</td><td>{ticket.scannedBy?.fullName || "Unknown"}</td><td>{ticket.scannedBy?.loginId || ticket.scannedBy?.collegePid || "Admin"}</td><td>{ticket.scannedBy?.departmentName || (ticket.scannedBy?.role === "admin" ? "Administration" : "—")}</td></tr>) : <tr><td colSpan="8">No participant entries match this search.</td></tr>}</tbody></table></div></section></main>;
}
