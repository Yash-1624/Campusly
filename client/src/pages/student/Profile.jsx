import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/Loading";
import TicketPass from "../../components/TicketPass";

const editableFields = ["fullName", "collegePid", "collegeName", "yearSemester", "mobileNumber"];
const profileForm = (profile) => Object.fromEntries(editableFields.map((key) => [key, profile?.[key] || ""]));

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);
    const [ticketsError, setTicketsError] = useState("");
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const acceptProfile = useCallback((data) => {
        setProfile(data);
        setForm(profileForm(data));
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get("/profile");
            acceptProfile(data.profile);
        } catch (err) {
            setError(err.response?.data?.message || "Your profile could not be loaded. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [acceptProfile]);

    useEffect(() => {
        let active = true;
        api.get("/profile")
            .then(({ data }) => { if (active) acceptProfile(data.profile); })
            .catch((err) => { if (active) setError(err.response?.data?.message || "Your profile could not be loaded. Please try again."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [acceptProfile]);

    useEffect(() => {
        let active = true;
        api.get("/tickets/my")
            .then(({ data }) => { if (active) setTickets(data.tickets || []); })
            .catch((err) => { if (active) setTicketsError(err.response?.data?.message || "Your tickets could not be loaded."); })
            .finally(() => { if (active) setTicketsLoading(false); });
        return () => { active = false; };
    }, []);

    const completeCount = useMemo(() => editableFields.filter((key) => String(form[key] || "").trim()).length + (profile?.isEmailVerified ? 1 : 0), [form, profile]);
    const completion = Math.round((completeCount / 6) * 100);
    const initials = (profile?.fullName || "Student").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const dirty = editableFields.some((key) => (form[key] || "") !== (profile?.[key] || ""));

    const change = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: name === "collegePid" ? value.toUpperCase() : value }));
        setMessage("");
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const { data } = await api.put("/profile", form);
            setMessage(data.message || "Your profile has been updated.");
            await refresh();
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || "Could not update your profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading && !profile) return <Loading text="Loading your profile…" />;

    if (!profile) return <main className="container profile-page"><div className="alert error" role="alert">{error || "Your profile is unavailable."}</div><button type="button" className="button secondary" onClick={refresh}>Try again</button></main>;

    return (
        <main className="container profile-page">
            <header className="profile-page-heading"><div><p className="eyebrow">ACCOUNT SETTINGS</p><h1>Your profile</h1><p>Keep your information up to date for a smoother event experience.</p></div><span className="profile-private"><span aria-hidden="true">◈</span> Your details stay private</span></header>

            {message && <div className="alert success profile-alert" role="status">{message}</div>}
            {error && <div className="alert error profile-alert" role="alert">{error}</div>}

            <div className="profile-layout">
                <aside className="profile-summary">
                    <div className="profile-summary-top"><div className="profile-avatar" aria-hidden="true">{initials || "S"}</div><span className={`profile-verification ${profile.isEmailVerified ? "verified" : "pending"}`}><i />{profile.isEmailVerified ? "Email verified" : "Verification pending"}</span></div>
                    <h2>{profile.fullName || "Student"}</h2>
                    <p className="profile-summary-college">{profile.collegeName || "Add your college or university"}</p>
                    <div className="profile-progress"><div className="profile-progress-heading"><span>Profile completeness</span><b>{completion}%</b></div><div className="profile-progress-track" role="progressbar" aria-valuenow={completion} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${completion}%` }} /></div><small>{completeCount} of 6 details completed</small></div>
                    <div className="profile-summary-details"><div><span>COLLEGE PID</span><strong>{profile.collegePid || "Not added"}</strong></div><div><span>YEAR / SEMESTER</span><strong>{profile.yearSemester || "Not added"}</strong></div><div><span>EMAIL ADDRESS</span><strong className="profile-summary-email">{profile.email}</strong></div></div>
                    <p className="profile-privacy-note"><span aria-hidden="true">✓</span> Your College PID is used to identify your event registration and entry ticket.</p>
                </aside>

                <form className={`profile-edit-card${isEditing ? " is-editing" : " is-readonly"}`} onSubmit={submit}>
                    <div className="profile-form-heading"><div><p className="eyebrow">PERSONAL INFORMATION</p><h2>{isEditing ? "Edit your details" : "Your details"}</h2><p>These details are used on registrations and event tickets.</p></div><div className="profile-form-heading-actions"><span className="profile-edit-icon" aria-hidden="true">{isEditing ? "✎" : "✓"}</span>{!isEditing && <button type="button" className="button secondary profile-start-edit" onClick={() => { setIsEditing(true); setMessage(""); setError(""); }}>Edit profile <span aria-hidden="true">✎</span></button>}</div></div>
                    <div className="profile-form-grid">
                        <label>Full name<input name="fullName" autoComplete="name" required value={form.fullName || ""} onChange={change} disabled={!isEditing || saving} /></label>
                        <label>College PID<input name="collegePid" autoComplete="off" required value={form.collegePid || ""} onChange={change} disabled={!isEditing || saving} /><small>Your PID appears on your event entry tickets.</small></label>
                        <label className="profile-field-wide">College or university<input name="collegeName" autoComplete="organization" required value={form.collegeName || ""} onChange={change} disabled={!isEditing || saving} /></label>
                        <label>Year or semester<input name="yearSemester" required value={form.yearSemester || ""} onChange={change} placeholder="e.g. 2nd year, Semester 4" disabled={!isEditing || saving} /></label>
                        <label>Mobile number<input name="mobileNumber" type="tel" autoComplete="tel" required value={form.mobileNumber || ""} onChange={change} disabled={!isEditing || saving} /></label>
                        <label className="profile-field-wide">Email address<div className="profile-email-field"><input type="email" autoComplete="email" value={profile.email || ""} disabled /><span>{profile.isEmailVerified ? "Verified" : "Unverified"}</span></div><small>Email address can’t be changed here.</small></label>
                    </div>
                    <div className="profile-form-footer"><span>{isEditing ? dirty ? "You have unsaved changes" : "Edit your details, then save" : "Your profile is up to date"}</span>{isEditing && <div><button type="button" className="button secondary" onClick={() => { setForm(profileForm(profile)); setMessage(""); setError(""); setIsEditing(false); }} disabled={saving}>Cancel</button><button className="button primary" type="submit" disabled={saving || !dirty}>{saving ? "Saving…" : "Save changes"}<span aria-hidden="true">↗</span></button></div>}</div>
                </form>
            </div>

            <section className="profile-tickets-section" aria-labelledby="profile-tickets-title">
                <div className="profile-tickets-heading"><div><p className="eyebrow">READY WHEN YOU ARE</p><h2 id="profile-tickets-title">Your event tickets</h2><p>Your entry passes stay here after registration.</p></div><Link className="button secondary" to="/student/registrations">All registrations ↗</Link></div>
                {ticketsLoading ? <p className="profile-tickets-empty">Loading your passes…</p>
                    : ticketsError ? <div className="alert error" role="alert">{ticketsError}</div>
                    : tickets.length ? <div className="profile-ticket-grid">{tickets.map((ticket) => <div className="profile-ticket-item" key={ticket._id}>
                        <TicketPass ticket={ticket} registration={ticket.registration} event={ticket.event} />
                        {ticket.registration?._id && <Link className="profile-ticket-details-link" to={`/student/registrations/${ticket.registration._id}`}>View registration details ↗</Link>}
                    </div>)}</div>
                    : <div className="profile-tickets-empty"><span aria-hidden="true">✦</span><div><strong>Your passes will appear here</strong><p>Once you complete a registration, its event ticket and QR code will be ready here.</p></div><Link to="/student/events">Explore events ↗</Link></div>}
            </section>
        </main>
    );
}
