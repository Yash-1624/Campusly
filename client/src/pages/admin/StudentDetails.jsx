import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/Loading";
import AdminPageHero from "../../components/AdminPageHero";

const profileFields = [
    ["fullName", "Full name"],
    ["collegePid", "College PID"],
    ["email", "Email address"],
    ["mobileNumber", "Mobile number"],
    ["collegeName", "College / University"],
    ["yearSemester", "Year / Semester"],
];

const initialEnrollment = {
    eventId: "",
    participationType: "Individual",
    teamName: "",
    numberOfMembers: 2,
};

export default function StudentDetails() {
    const { id } = useParams();

    const [data, setData] = useState(null);
    const [events, setEvents] = useState([]);
    const [form, setForm] = useState(null);
    const [password, setPassword] = useState("");
    const [enrollment, setEnrollment] = useState(initialEnrollment);
    const [ticketForms, setTicketForms] = useState({});
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const [studentResponse, eventResponse] = await Promise.all([
                api.get(`/admin/students/${id}`),
                api.get("/events"),
            ]);

            const result = studentResponse.data;
            setData(result);
            setForm({ ...result.student });

            const eventList = Array.isArray(eventResponse.data.events)
                ? eventResponse.data.events
                : Array.isArray(eventResponse.data)
                    ? eventResponse.data
                    : [];
            setEvents(eventList);

            const forms = {};
            (result.tickets || []).forEach((ticket) => {
                forms[ticket.ticketId] = {
                    collegePid: ticket.collegePid || "",
                    studentName: ticket.studentName || "",
                    eventName: ticket.eventName || "",
                };
            });
            setTicketForms(forms);
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to load student details."
            );
        }
    }, [id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    if (!data || !form) {
        if (error) {
            return (
                <main className="container">
                    <div className="alert error">{error}</div>
                    <Link to="/control-center/students">Back to students</Link>
                </main>
            );
        }
        return <Loading />;
    }

    // ========================================
    // SAVE PROFILE
    // ========================================
    const saveProfile = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setSaving(true);

        try {
            const payload = {
                fullName: form.fullName,
                collegePid: form.collegePid,
                email: form.email,
                mobileNumber: form.mobileNumber,
                collegeName: form.collegeName,
                yearSemester: form.yearSemester,
                isEmailVerified: Boolean(form.isEmailVerified),
            };

            if (password.trim()) {
                payload.password = password.trim();
            }

            const { data: response } = await api.patch(
                `/admin/students/${id}`,
                payload
            );

            setData((current) => ({
                ...current,
                student: response.student,
            }));
            setForm(response.student);
            setPassword("");
            setMessage("Student profile updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to update student."
            );
        } finally {
            setSaving(false);
        }
    };

    // ========================================
    // ADD TO EVENT
    // ========================================
    const addToEvent = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setSaving(true);

        try {
            const { data: response } = await api.post("/registrations/admin/add", {
                studentId: id,
                ...enrollment,
            });

            setMessage(response.message || "Student added to event successfully.");
            setEnrollment(initialEnrollment);
            await load();
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to add student to event."
            );
        } finally {
            setSaving(false);
        }
    };

    // ========================================
    // SAVE TICKET
    // ========================================
    const saveTicket = async (ticketId) => {
        setError("");
        setMessage("");
        setSaving(true);

        try {
            const { data: response } = await api.patch(
                `/admin/tickets/${encodeURIComponent(ticketId)}`,
                ticketForms[ticketId]
            );

            setMessage(response.message || "Ticket updated successfully.");
            await load();
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to update ticket."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="container admin-student-details-page">
            <AdminPageHero eyebrow="STUDENT MANAGEMENT" title="Student Details" description="Edit the profile, add the student to an event, and manage generated ticket details." actions={<Link className="button primary" to="/control-center/students">All Students</Link>} />

            {/* Alerts */}
            {message && <div className="alert success">{message}</div>}
            {error && <div className="alert error">{error}</div>}

            {/* Edit Profile */}
            <section className="card admin-form-card">
                <h2>Edit Student Profile</h2>

                <form onSubmit={saveProfile}>
                    <div className="admin-form-grid">
                        {profileFields.map(([name, label]) => (
                            <label key={name}>
                                {label}
                                <input
                                    name={name}
                                    type={name === "email" ? "email" : "text"}
                                    required
                                    value={form[name] || ""}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            [name]: e.target.value,
                                        }))
                                    }
                                    disabled={saving}
                                />
                            </label>
                        ))}
                    </div>

                    <label>
                        Set new password (optional)
                        <input
                            type="password"
                            minLength={8}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current password"
                            disabled={saving}
                        />
                    </label>

                    <label className="checkbox-line">
                        <input
                            type="checkbox"
                            checked={Boolean(form.isEmailVerified)}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    isEmailVerified: e.target.checked,
                                }))
                            }
                            disabled={saving}
                        />
                        Mark email as verified
                    </label>

                    <button className="button primary" disabled={saving}>
                        {saving ? "Saving…" : "Save Student Changes"}
                    </button>
                </form>
            </section>

            {/* Add to Event */}
            <section className="card admin-form-card">
                <h2>Add Student to an Event</h2>
                <p className="page-subtitle">
                    This creates a registration with payment pending. It does not fake a
                    payment or generate a paid ticket.
                </p>

                <form onSubmit={addToEvent}>
                    <div className="admin-form-grid">
                        <label>
                            Event
                            <select
                                required
                                value={enrollment.eventId}
                                onChange={(e) =>
                                    setEnrollment((current) => ({
                                        ...current,
                                        eventId: e.target.value,
                                    }))
                                }
                                disabled={saving}
                            >
                                <option value="">Select an event</option>
                                {events.map((event) => (
                                    <option key={event._id} value={event._id}>
                                        {event.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Participation type
                            <select
                                value={enrollment.participationType}
                                onChange={(e) =>
                                    setEnrollment((current) => ({
                                        ...current,
                                        participationType: e.target.value,
                                    }))
                                }
                                disabled={saving}
                            >
                                <option value="Individual">Individual</option>
                                <option value="Team">Team</option>
                            </select>
                        </label>

                        {enrollment.participationType === "Team" && (
                            <>
                                <label>
                                    Team name
                                    <input
                                        required
                                        value={enrollment.teamName}
                                        onChange={(e) =>
                                            setEnrollment((current) => ({
                                                ...current,
                                                teamName: e.target.value,
                                            }))
                                        }
                                        disabled={saving}
                                    />
                                </label>

                                <label>
                                    Number of members
                                    <input
                                        type="number"
                                        min="2"
                                        required
                                        value={enrollment.numberOfMembers}
                                        onChange={(e) =>
                                            setEnrollment((current) => ({
                                                ...current,
                                                numberOfMembers: e.target.value,
                                            }))
                                        }
                                        disabled={saving}
                                    />
                                </label>
                            </>
                        )}
                    </div>

                    <button
                        className="button primary"
                        disabled={saving || !events.length}
                    >
                        {saving ? "Adding…" : "Add to Event"}
                    </button>
                </form>
            </section>

            {/* Registrations */}
            <section className="card admin-form-card">
                <h2>Registrations</h2>

                {(data.registrations || []).length > 0 ? (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Registration ID</th>
                                    <th>Event</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.registrations.map((registration) => (
                                    <tr key={registration._id}>
                                        <td>{registration.registrationId}</td>
                                        <td>{registration.event?.name || "Event"}</td>
                                        <td><span className={`payment-state${String(registration.payment?.status || "Pending").toLowerCase().includes("pending") ? " is-pending" : ""}`}>{registration.payment?.status || "Pending"}</span></td>
                                        <td>{registration.registrationStatus}</td>
                                        <td>
                                            {new Date(registration.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-state">No registrations yet.</p>
                )}
            </section>

            {/* Generated Tickets */}
            <section className="card admin-form-card">
                <h2>Generated Tickets</h2>
                <p className="page-subtitle">
                    You can correct the displayed student name, College PID, and event
                    name. The QR code is regenerated automatically. Ticket ID and entry
                    scan history are preserved.
                </p>

                {(data.tickets || []).length > 0 ? (
                    data.tickets.map((ticket) => (
                        <div className="admin-ticket-editor" key={ticket._id}>
                            <div className="ticket-editor-heading">
                                <div>
                                    <strong>{ticket.ticketId}</strong>
                                    <span
                                        className={
                                            ticket.entryStatus === "Entered"
                                                ? "status-pill success"
                                                : "status-pill warning"
                                        }
                                    >
                                        {ticket.entryStatus}
                                    </span>
                                </div>
                                <small>
                                    {ticket.event?.name || ticket.eventName} ·{" "}
                                    {ticket.enteredAt
                                        ? `Scanned ${new Date(ticket.enteredAt).toLocaleString()}`
                                        : "Not scanned"}
                                </small>
                            </div>

                            <div className="admin-form-grid">
                                {[
                                    ["collegePid", "College PID"],
                                    ["studentName", "Ticket student name"],
                                    ["eventName", "Ticket event name"],
                                ].map(([field, label]) => (
                                    <label key={field}>
                                        {label}
                                        <input
                                            value={ticketForms[ticket.ticketId]?.[field] || ""}
                                            onChange={(e) =>
                                                setTicketForms((current) => ({
                                                    ...current,
                                                    [ticket.ticketId]: {
                                                        ...current[ticket.ticketId],
                                                        [field]: e.target.value,
                                                    },
                                                }))
                                            }
                                            disabled={saving}
                                        />
                                    </label>
                                ))}
                            </div>

                            <div className="ticket-editor-footer">
                                {ticket.qrCode && (
                                    <img
                                        className="admin-ticket-qr"
                                        src={ticket.qrCode}
                                        alt={`QR code for ${ticket.ticketId}`}
                                    />
                                )}

                                <button
                                    className="button primary"
                                    onClick={() => saveTicket(ticket.ticketId)}
                                    disabled={saving}
                                >
                                    Save Ticket & Regenerate QR
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="empty-state">
                        No tickets have been generated for this student yet. Tickets are
                        created after successful payment.
                    </p>
                )}
            </section>
        </main>
    );
}
