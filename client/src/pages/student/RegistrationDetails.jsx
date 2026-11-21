import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/Loading";
import TicketPass from "../../components/TicketPass";

const Detail = ({ label, children }) => (
    <div className="registration-detail-item">
        <span>{label}</span>
        <strong>{children || "—"}</strong>
    </div>
);

const formatDate = (value) => value ? new Date(value).toLocaleString() : "To be announced";

export default function RegistrationDetails() {
    const { id } = useParams();
    const [registration, setRegistration] = useState(null);
    const [ticket, setTicket] = useState(null);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState("");
    const [teamName, setTeamName] = useState("");
    const [memberCount, setMemberCount] = useState(2);
    const [participationType, setParticipationType] = useState("Individual");

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const response = await api.get(`/registrations/${id}`);
                if (!active) return;
                setRegistration(response.data.registration);
                setParticipationType(response.data.registration.participation?.type || "Individual");
                setTeamName(response.data.registration.participation?.teamName || "");
                setMemberCount(response.data.registration.participation?.numberOfMembers || 2);
                try {
                    const ticketResponse = await api.get(`/tickets/registration/${id}`);
                    if (active) setTicket(ticketResponse.data.ticket);
                } catch {
                    // A ticket can be unavailable while a registration is pending.
                }
            } catch (err) {
                if (active) setError(err.response?.data?.message || "Could not load registration.");
            }
        };
        if (id) load();
        return () => { active = false; };
    }, [id]);

    if (!registration && !error) return <Loading />;
    if (error) return <main className="container registration-detail-page"><div className="alert error">{error}</div><Link className="button secondary" to="/student/registrations">Back to My Registrations</Link></main>;

    const payment = registration.payment || {};
    const saveParticipation = async (event) => { event.preventDefault(); setEditError(""); try { const { data } = await api.patch(`/registrations/${id}`, { participationType, teamName, numberOfMembers: memberCount }); setRegistration(data.registration); setEditing(false); } catch (err) { setEditError(err.response?.data?.message || "Could not update registration."); } };
    const confirmed = registration.registrationStatus === "Confirmed";

    return (
        <main className="container registration-detail-page">
            <Link className="registration-back-link" to="/student/registrations">← My registrations</Link>
            <header className="registration-detail-hero">
                <div>
                    <p className="registration-detail-eyebrow">CAMPUSLY · REGISTRATION</p>
                    <h1>{registration.event?.name || "Registration details"}</h1>
                    <p className="registration-detail-lead">Your event booking, payment information, and entry ticket in one place.</p>
                </div>
                <span className={`registration-status-pill ${confirmed ? "is-confirmed" : "is-pending"}`}>
                    <i aria-hidden="true" />{registration.registrationStatus || "Pending"}
                </span>
            </header>

            <div className="registration-detail-layout">
                <div className="registration-detail-main">
                    <section className="registration-detail-card">
                        <div className="registration-section-heading"><span>01</span><div><h2>Event information</h2><p>Where and when you’ll take part</p></div></div>
                        <div className="registration-detail-grid">
                            <Detail label="Event">{registration.event?.name}</Detail>
                            <Detail label="Category">{registration.event?.category}</Detail>
                            <Detail label="Date & time">{formatDate(registration.event?.date)}</Detail>
                            <Detail label="Venue">{registration.event?.location}</Detail>
                        </div>
                    </section>

                    <section className="registration-detail-card">
                        {registration.registrationStatus === "Pending Payment" && <button type="button" className="button secondary" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel edit" : "Edit registration"}</button>}
                        {editing && <form className="registration-edit-form" onSubmit={saveParticipation}><label>Participation type<select value={participationType} onChange={(event) => setParticipationType(event.target.value)}><option>Individual</option>{registration.event?.participationType?.team && <option>Team</option>}</select></label>{participationType === "Team" && <><label>Team name<input required value={teamName} onChange={(event) => setTeamName(event.target.value)} /></label><label>Team members<input type="number" min={registration.event?.teamSettings?.minMembers || 2} max={registration.event?.teamSettings?.maxMembers || 20} value={memberCount} onChange={(event) => setMemberCount(event.target.value)} /></label></>}<button className="button primary" type="submit">Save changes</button>{editError && <div className="alert error">{editError}</div>}</form>}
                        <div className="registration-section-heading"><span>02</span><div><h2>Participant</h2><p>Details submitted with your registration</p></div></div>
                        <div className="registration-detail-grid">
                            <Detail label="Full name">{registration.studentInformation?.fullName}</Detail>
                            <Detail label="College PID">{registration.studentInformation?.collegePid}</Detail>
                            <Detail label="College / university">{registration.studentInformation?.collegeName}</Detail>
                            <Detail label="Year / semester">{registration.studentInformation?.yearSemester}</Detail>
                            <Detail label="Email">{registration.contactInformation?.email}</Detail>
                            <Detail label="Mobile">{registration.contactInformation?.mobileNumber}</Detail>
                            <Detail label="Participation">{registration.participation?.type}</Detail>
                            {registration.participation?.type === "Team" && <>
                                <Detail label="Team name">{registration.participation?.teamName}</Detail>
                                <Detail label="Team members">{registration.participation?.numberOfMembers}</Detail>
                            </>}
                        </div>
                    </section>

                    <section className="registration-detail-card payment-detail-card">
                        <div className="registration-section-heading"><span>03</span><div><h2>Payment</h2><p>Transaction and amount summary</p></div></div>
                        <div className="registration-detail-grid">
                            <Detail label="Payment status"><span className={`payment-state${String(payment.status || "Pending").toLowerCase().includes("pending") ? " is-pending" : ""}`}>{payment.status || "Pending"}</span></Detail>
                            <Detail label="Amount">₹{Number(payment.amount ?? registration.event?.fee ?? 0).toLocaleString("en-IN")}</Detail>
                            <Detail label="Transaction ID">{payment.transactionId}</Detail>
                            <Detail label="Payment method">{payment.paymentMethod}</Detail>
                        </div>
                    </section>
                </div>

                <aside className="registration-detail-aside">
                    <section className="registration-reference-card">
                        <p className="registration-detail-eyebrow">BOOKING REFERENCE</p>
                        <strong>{registration.registrationId}</strong>
                        <span>Registered {formatDate(registration.createdAt)}</span>
                    </section>

                    {ticket ? <section className="registration-ticket-card">
                        <div className="registration-ticket-heading"><div><p className="registration-detail-eyebrow">YOUR ENTRY PASS</p><h2>Event ticket</h2></div></div>
                        <TicketPass ticket={ticket} registration={registration} />
                        {ticket.enteredAt && <div className="registration-ticket-meta"><span>Checked in</span><strong>{formatDate(ticket.enteredAt)}</strong></div>}
                    </section> : confirmed ? <section className="registration-ticket-pending"><strong>Your ticket is being prepared</strong><p>Registration is confirmed, but the QR ticket is not available yet. Please check again shortly.</p></section> : <section className="registration-ticket-pending"><strong>Your ticket will appear here</strong><p>Once your registration is confirmed, your event entry QR code will be available here.</p></section>}

                    <Link className="button secondary registration-list-button" to="/student/registrations">View all registrations <span aria-hidden="true">↗</span></Link>
                </aside>
            </div>
        </main>
    );
}
