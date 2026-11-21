import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/Loading";

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatStatus = (value) => value || "Pending";

export default function EventParticipants() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get(`/admin/events/${id}/participants`)
            .then(({ data }) => {
                if (!active) return;
                setEvent(data.event);
                setParticipants(Array.isArray(data.participants) ? data.participants : []);
            })
            .catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load event participants."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id]);

    if (loading) return <Loading text="Loading event participants…" />;

    return (
        <main className="container event-participants-page">
            <Link className="event-participants-back" to="/control-center/events">← Back to Manage Events</Link>
            <header className="event-participants-heading">
                <div><p className="eyebrow">EVENT PARTICIPANTS</p><h1>{event?.name || "Event Participants"}</h1><p>{event?.category || ""} {event?.date ? `• ${formatDate(event.date)}` : ""} {event?.location ? `• ${event.location}` : ""}</p></div>
                <div className="event-participants-count"><strong>{participants.length}</strong><span>Registered</span></div>
            </header>
            {error && <div className="alert error" role="alert">{error}</div>}
            {!error && participants.length === 0 ? <section className="event-participants-empty"><h2>No participants yet</h2><p>Registrations for this event will appear here.</p></section> : !error && (
                <section className="event-participants-table-card">
                    <div className="event-participants-table-wrap"><table><thead><tr><th>#</th><th>Participant</th><th>College PID</th><th>Email</th><th>Participation</th><th>Registration</th><th>Payment</th><th>Registered on</th></tr></thead>
                        <tbody>{participants.map((item, index) => {
                            const person = item.participant || item.studentInformation || {};
                            const payment = item.paymentDetails || {};
                            return <tr key={item._id}><td>{index + 1}</td><td><strong>{person.fullName || "—"}</strong><small>{person.collegeName || ""}</small></td><td>{person.collegePid || "—"}</td><td>{item.contactInformation?.email || item.student?.email || "—"}</td><td>{item.participation?.type || "Individual"}{item.participation?.teamName ? ` · ${item.participation.teamName}` : ""}</td><td><span className="event-participant-status">{formatStatus(item.registrationStatus)}</span></td><td>{payment.status || item.payment?.status || "Pending"}</td><td>{formatDate(item.createdAt)}</td></tr>;
                        })}</tbody></table></div>
                </section>
            )}
        </main>
    );
}
