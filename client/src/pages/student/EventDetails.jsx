import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/Loading";

const dateTime = (value) => value ? new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)) : "To be announced";

export default function EventDetails() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [related, setRelated] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([api.get(`/events/${id}`), api.get("/events")])
            .then(([detailResponse, listResponse]) => {
                if (!active) return;
                const current = detailResponse.data.event;
                setEvent(current);
                setRelated((listResponse.data.events || []).filter((item) => item._id !== current._id && item.category === current.category).slice(0, 3));
            })
            .catch((err) => { if (active) setError(err.response?.data?.message || "Could not load event."); });
        return () => { active = false; };
    }, [id]);

    if (error) return <main className="container"><div className="alert error">{error}</div><Link className="button secondary" to="/student/events">Back to events</Link></main>;
    if (!event) return <Loading />;

    const team = Boolean(event.participationType?.team);
    const individual = event.participationType?.individual !== false;

    return (
        <main className="container event-detail-page">
            <nav className="event-breadcrumb" aria-label="Breadcrumb"><Link to="/student/events">Events</Link><span>/</span><span>{event.category}</span></nav>
            <section className="event-detail-hero">
                {event.imageUrl ? <img className="event-detail-cover" src={event.imageUrl} alt={`${event.name} event cover`} /> : <div className="event-detail-cover event-cover-placeholder" aria-hidden="true"><span>✳</span><b>{event.category}</b></div>}
                <div className="event-detail-cover-shade" />
                <div className="event-detail-title"><span className="event-detail-category">{event.category}</span><h1>{event.name}</h1><p>{event.location}</p></div>
            </section>
            <div className="event-detail-layout">
                <article className="event-description-column">
                    <div className="event-facts">
                        <div><span className="fact-icon">◷</span><div><small>DATE & TIME</small><strong>{dateTime(event.date)}</strong></div></div>
                        <div><span className="fact-icon">⌖</span><div><small>LOCATION</small><strong>{event.location}</strong></div></div>
                        <div><span className="fact-icon">◈</span><div><small>FORMAT</small><strong>{team && individual ? "Individual or team" : team ? "Team participation" : "Individual participation"}</strong></div></div>
                    </div>
                    <section className="event-about"><p className="eyebrow">ABOUT THIS EVENT</p><h2>What to expect</h2><p className="event-full-description">{event.description}</p></section>
                    {related.length > 0 && <section className="related-events"><div className="related-heading"><div><p className="eyebrow">KEEP EXPLORING</p><h2>More in {event.category}</h2></div><Link to="/student/events">All events ↗</Link></div><div className="related-event-list">{related.map((item) => <Link key={item._id} to={`/student/events/${item._id}`} className="related-event-card"><span className="related-date">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(item.date))}</span><span><strong>{item.name}</strong><small>{item.location}</small></span><b aria-hidden="true">↗</b></Link>)}</div></section>}
                </article>
                <aside className="event-booking-card"><span className="booking-status"><i />{event.status}</span><p className="booking-label">Registration fee</p><div className="booking-price">{Number(event.fee) > 0 ? `₹${Number(event.fee).toLocaleString("en-IN")}` : "Free"}<small>{Number(event.fee) > 0 ? "per participant" : "No ticket fee"}</small></div><div className="booking-window"><small>REGISTRATION WINDOW</small><strong>{dateTime(event.registrationStartDate)}</strong><span>through</span><strong>{dateTime(event.registrationEndDate)}</strong></div><Link className="button primary event-register-button" to={`/student/events/${id}/register`}>Register for event <span aria-hidden="true">↗</span></Link><p className="booking-note">Your place is confirmed after registration is complete.</p></aside>
            </div>
        </main>
    );
}
