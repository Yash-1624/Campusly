import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import AdminStatsBoard from "../../components/AdminStatsBoard";
import AdminPageHero from "../../components/AdminPageHero";

export default function ManageRegistrations() {
    const [registrations, setRegistrations] = useState(null);
    const [search, setSearch] = useState("");
    const [eventFilter, setEventFilter] = useState("all");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/registrations/admin/all")
            .then(({ data }) => { if (active) setRegistrations(Array.isArray(data.registrations) ? data.registrations.filter((item) => item && typeof item === "object") : []); })
            .catch((err) => { if (active) { setError(err.response?.data?.message || "Unable to load registrations."); setRegistrations([]); } });
        return () => { active = false; };
    }, []);

    const events = useMemo(() => [...new Map((registrations || []).filter((item) => item?.event).map((item) => [item.event._id, item.event])).values()].sort((a, b) => (a.name || "").localeCompare(b.name || "")), [registrations]);

    const filtered = useMemo(() => {
        if (!registrations) return [];
        const query = search.trim().toLowerCase();
        return registrations.filter((registration) => {
            if (eventFilter !== "all" && registration.event?._id !== eventFilter) return false;
            return [registration.registrationId, registration.student?.fullName, registration.student?.email, registration.student?.collegeName, registration.event?.name, registration.event?.category, registration.participation?.teamName]
                .some((value) => String(value || "").toLowerCase().includes(query));
        });
    }, [registrations, search, eventFilter]);

    const groups = useMemo(() => {
        const grouped = new Map();
        filtered.forEach((registration) => {
            const id = registration.event?._id || "event-unavailable";
            if (!grouped.has(id)) grouped.set(id, { event: registration.event, registrations: [] });
            grouped.get(id).registrations.push(registration);
        });
        return [...grouped.values()].sort((a, b) => (a.event?.name || "Event unavailable").localeCompare(b.event?.name || "Event unavailable"));
    }, [filtered]);

    if (!registrations) return <Loading />;

    return (
        <main className="container admin-registrations-page">
            <AdminPageHero eyebrow="EVENT PARTICIPANTS" title="Manage Registrations" description="Browse participants grouped by event." aside={<span className="status-pill success">{filtered.length} registrations</span>} />
            {error && <div className="alert error" role="alert">{error}</div>}
            <AdminStatsBoard items={[
                { label: "Matching registrations", value: filtered.length, note: "Current search and event", icon: "?" },
                { label: "Confirmed", value: filtered.filter((item) => item.registrationStatus === "Confirmed").length, note: "Ready for the event", icon: "?" },
                { label: "Pending payment", value: filtered.filter((item) => item.registrationStatus === "Pending Payment").length, note: "Awaiting checkout", icon: "?", tone: "danger" },
                { label: "Events", value: new Set(filtered.map((item) => item.event?._id).filter(Boolean)).size, note: "With matching participants", icon: "?" },
            ]} />
            <div className="registration-listing-filters">
                <input className="search" type="search" aria-label="Search registrations" placeholder="Search student, event, team, or registration ID..." value={search} onChange={(event) => setSearch(event.target.value)} />
                <label className="registration-event-filter">Event<select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}><option value="all">All events</option>{events.map((event) => <option key={event._id} value={event._id}>{event.name}</option>)}</select></label>
            </div>
            {groups.length ? groups.map(({ event, registrations: eventRegistrations }) => (
                <section className="registration-event-group" key={event?._id || "event-unavailable"}>
                    <header className="registration-event-group-heading"><div><h2>{event?.name || "Event unavailable"}</h2><span>{event?.category || "Uncategorized event"}</span></div><strong>{eventRegistrations.length} {eventRegistrations.length === 1 ? "participant" : "participants"}</strong></header>
                    <div className="table-wrap"><table>
                        <thead><tr><th>Registration ID</th><th>Student</th><th>College</th><th>Participation</th><th>Team</th><th>Members</th><th>Payment</th><th>Status</th><th>Registered</th></tr></thead>
                        <tbody>{eventRegistrations.map((registration) => <tr key={registration._id}>
                            <td><span className="registration-row-primary">{registration.registrationId}</span></td><td><strong className="registration-student-name">{registration.student?.fullName || "Unknown student"}</strong><br /><small className="registration-student-email">{registration.student?.email || ""}</small></td><td>{registration.student?.collegeName || "-"}</td><td>{registration.participation?.type || "-"}</td><td>{registration.participation?.teamName || "-"}</td><td>{registration.participation?.numberOfMembers ?? "-"}</td><td><span className={`registration-row-emphasis payment-state${String(registration.payment?.status || "").toLowerCase().includes("pending") ? " is-pending" : ""}`}>{registration.payment?.status || "-"}</span></td><td><span className={`registration-row-emphasis payment-state${String(registration.registrationStatus || "").toLowerCase().includes("pending") ? " is-pending" : ""}`}>{registration.registrationStatus || "-"}</span></td><td>{registration.createdAt ? new Date(registration.createdAt).toLocaleString() : "-"}</td>
                        </tr>)}</tbody>
                    </table></div>
                </section>
            )) : <section className="registration-groups-empty"><h2>No matching participants</h2><p>Try another search or choose a different event.</p></section>}
        </main>
    );
}
