import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";

const emptyForm = { fullName: "", departmentName: "", mobileNumber: "", studentId: "", email: "", eventIds: [] };
export default function ManageVolunteers() {
    const [volunteers, setVolunteers] = useState(null);
    const [events, setEvents] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [credentials, setCredentials] = useState(null);

    const load = async () => {
        const [v, e] = await Promise.all([api.get("/admin/volunteers"), api.get("/events")]);
        setVolunteers(v.data.volunteers || []);
        const list = e.data.events || e.data || [];
        setEvents(Array.isArray(list) ? list : []);
    };
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load().catch((err) => setError(err.response?.data?.message || "Unable to load volunteer data."));
    }, []);
    const change = (e) => setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
    const toggleEvent = (eventId) => setForm((current) => ({
        ...current,
        eventIds: current.eventIds.includes(eventId)
            ? current.eventIds.filter((id) => id !== eventId)
            : [...current.eventIds, eventId]
    }));
    const create = async (e) => {
        e.preventDefault(); setBusy(true); setError(""); setMessage(""); setCredentials(null);
        try { const { data } = await api.post("/admin/volunteers", form); setMessage(data.message); setCredentials(data.credentialsSent ? { loginId: data.credentials?.loginId, email: form.email } : null); setForm(emptyForm); setShowForm(false); await load(); }
        catch (err) { setError(err.response?.data?.message || "Unable to create volunteer."); } finally { setBusy(false); }
    };
    if (!volunteers) return <Loading />;
    return <main className="container admin-volunteers-page">
        <div className="page-heading"><div><p className="login-eyebrow">ADMINISTRATION</p><h1>Manage Volunteers</h1><p className="page-subtitle">Create volunteer accounts, assign one or more events, and email a separate allocation notice for each event.</p></div><button className="button primary" onClick={() => { setShowForm((v) => !v); setError(""); setMessage(""); setCredentials(null); }}>{showForm ? "Cancel" : "+ Add Volunteer"}</button></div>
        {error && <div className="alert error">{error}</div>}{message && <div className="alert success">{message}</div>}
        {credentials && <section className="card volunteer-credentials"><h2>Credentials emailed successfully</h2><p>The volunteer's Login ID and temporary password have been sent to <strong>{credentials.email}</strong>.</p><p><strong>Login ID:</strong> {credentials.loginId}</p><p>The temporary password is intentionally not displayed here. Ask the volunteer to check their inbox (and spam folder).</p></section>}
        {showForm && <form className="card admin-form-card" onSubmit={create}><h2>New Volunteer</h2><div className="admin-form-grid">
            <label>Volunteer Name<input name="fullName" value={form.fullName} onChange={change} required /></label>
            <label>Department Name<input name="departmentName" value={form.departmentName} onChange={change} required placeholder="e.g. Computer Science" /></label>
            <label>Mobile Number<input name="mobileNumber" type="tel" inputMode="numeric" maxLength={10} value={form.mobileNumber} onChange={change} required /></label>
            <label>Student ID<input name="studentId" value={form.studentId} onChange={change} required /></label>
            <label>Email Address<input name="email" type="email" value={form.email} onChange={change} required placeholder="volunteer@example.com" /></label>
            <fieldset className="volunteer-event-picker" style={{ gridColumn: "1 / -1", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
                <legend>Assign Events (select one or multiple)</legend>
                {events.map((event) => <label key={event._id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", margin: "10px 0" }}>
                    <input type="checkbox" checked={form.eventIds.includes(event._id)} onChange={() => toggleEvent(event._id)} />
                    <span><strong>{event.name}</strong><br /><small>{event.category || "Event"} · {event.date ? new Date(event.date).toLocaleString() : "Date TBA"} · {event.location || "Location TBA"}</small></span>
                </label>)}
                <small>{form.eventIds.length} event(s) selected. A separate allocation email will be sent for each selected event.</small>
            </fieldset>
        </div><button className="button primary" type="submit" disabled={busy || !events.length || !form.eventIds.length}>{busy ? "Creating…" : "Create Volunteer & Email Login Credentials"}</button>{!events.length && <p className="hint">Create an event before adding a volunteer.</p>}</form>}
        <section className="card table-card"><h2>Volunteer Accounts ({volunteers.length})</h2>{!volunteers.length ? <p>No volunteers have been added yet.</p> : <div className="table-responsive"><table><thead><tr><th>Name</th><th>Department</th><th>Mobile</th><th>Student ID</th><th>Login ID</th><th>Assigned Events</th><th>Created</th></tr></thead><tbody>{volunteers.map((v) => <tr key={v._id}><td>{v.fullName}</td><td>{v.departmentName || "—"}</td><td>{v.mobileNumber}</td><td>{v.collegePid}</td><td>{v.loginId}</td><td><div>{(v.assignedEvents || []).map((event) => <div key={event._id || event}>{event.name || "Assigned event"}</div>)}</div></td><td>{new Date(v.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</section>
    </main>;
}
