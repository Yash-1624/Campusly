import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/Loading";
import TicketPass from "../../components/TicketPass";
import "./RegistrationSuccess.css";

export default function RegistrationSuccess() {
  const { id } = useParams();
  const [registration, setRegistration] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get(`/registrations/${id}`);
        setRegistration(response.data.registration);
        try {
          const ticketResponse = await api.get(`/tickets/registration/${id}`);
          setTicket(ticketResponse.data.ticket);
        } catch (ticketError) {
          console.error("Ticket loading error:", ticketError);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Could not load registration.");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  if (loading) return <Loading />;
  if (!registration) return <main className="container registration-success-page"><div className="alert error">{error || "Registration not found."}</div></main>;

  const payment = registration.payment || {};
  const participation = registration.participation || {};
  const event = registration.event || {};

  return (
    <main className="container registration-success-page">
      <div className="registration-success-shell">
        <section className="registration-success-hero">
          <div className="registration-success-check" aria-hidden="true">&#10003;</div>
          <div className="registration-success-copy">
            <span className="registration-success-eyebrow">YOU’RE ON THE LIST</span>
            <h1>Registration confirmed<span>.</span></h1>
            <p>Your place is saved. Keep this pass handy and get ready for a great event.</p>
          </div>
          <div className="registration-success-status"><i /> Confirmed</div>
          <div className="registration-success-orbit" aria-hidden="true"><b>✦</b></div>
        </section>

        <section className="registration-summary" aria-label="Registration summary">
          <div className="registration-summary-heading">
            <div><span className="registration-success-eyebrow">THE DETAILS</span><h2>Your event, at a glance</h2></div>
            <span className="registration-summary-category">{event.category || "Campus event"}</span>
          </div>
          <div className="registration-summary-grid">
            <article className="registration-summary-event">
              <span className="registration-detail-label">EVENT</span>
              <h3>{event.name}</h3>
              <div className="registration-event-meta">
                <div><span>DATE &amp; TIME</span><strong>{event.date ? new Date(event.date).toLocaleString() : "Date to be announced"}</strong></div>
                <div><span>VENUE</span><strong>{event.location || "Venue to be announced"}</strong></div>
              </div>
            </article>
            <article className="registration-summary-detail">
              <span className="registration-detail-icon">✦</span>
              <span className="registration-detail-label">YOUR REGISTRATION</span>
              <strong>{participation.type || "Individual"}{participation.type === "Team" && participation.teamName ? <> &middot; {participation.teamName}</> : " entry"}</strong>
              {participation.type === "Team" && <small>{participation.numberOfMembers} team members</small>}
              <small className="registration-id">{registration.registrationId}</small>
            </article>
            <article className="registration-summary-detail payment-detail">
              <span className="registration-detail-icon">&#10003;</span>
              <span className="registration-detail-label">PAYMENT</span>
              <strong>{payment.status || "Confirmed"}{payment.amount !== undefined ? <> &middot; &#8377;{payment.amount}</> : ""}</strong>
              <small>{payment.transactionId ? `Transaction ${payment.transactionId}` : "Your booking is confirmed"}</small>
            </article>
          </div>
        </section>

        {ticket ? <section className="registration-ticket-section">
          <div className="registration-ticket-heading"><div><span className="registration-success-eyebrow">READY WHEN YOU ARE</span><h2>Your entry pass</h2><p>Download your ticket or show its QR code at the entrance.</p></div><span className="registration-ticket-sparkle" aria-hidden="true">&#10022;</span></div>
          <TicketPass ticket={ticket} registration={registration} />
        </section> : <div className="alert error registration-ticket-error">Payment was successful, but your QR ticket could not be loaded. You can still find your registration in your account.</div>}

        <footer className="registration-success-actions">
          <p>Need it later? Your pass is saved in <strong>My Registrations</strong>.</p>
          <div className="button-row">
            <Link className="button primary" to="/student/registrations">My Registrations <span aria-hidden="true">&#8599;</span></Link>
            <Link className="button" to={`/student/registrations/${id}`}>View registration details</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
