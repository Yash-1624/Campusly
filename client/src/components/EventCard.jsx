import { Link } from "react-router-dom";

export default function EventCard({ event, admin = false }) {
    const participation = event.participationType?.team && event.participationType?.individual
        ? "Individual · Team"
        : event.participationType?.team ? "Team" : "Individual";
    const date = event.date ? new Date(event.date) : null;

    return (
        <article className="card event-card premium-event-card">
            <Link className="premium-event-art" to={admin ? `/control-center/events/edit/${event._id}` : `/student/events/${event._id}`} aria-label={`${admin ? "Edit" : "View"} ${event.name}`}>
                {event.imageUrl ? <img className="event-card-image" src={event.imageUrl} alt={`${event.name} event poster`} loading="lazy" /> : <div className="event-card-art-fallback" aria-hidden="true"><span>✳</span><small>{event.category}</small></div>}
                {date && <span className="event-card-date"><b>{date.toLocaleDateString("en", { day: "2-digit" })}</b><small>{date.toLocaleDateString("en", { month: "short" })}</small></span>}
            </Link>
            <div className="premium-event-body">
                <div className="event-card-labels"><span className="badge">{event.category}</span><span className={`event-status status-${String(event.status || "").toLowerCase().replaceAll(" ", "-")}`}>{event.status}</span></div>
                <h3>{event.name}</h3>
                <p className="premium-event-description">{event.description}</p>
                <div className="premium-event-meta"><span><i aria-hidden="true">◷</i>{date ? date.toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Date to be announced"}</span><span><i aria-hidden="true">⌖</i>{event.location}</span><span><i aria-hidden="true">◈</i>{participation}</span></div>
                <div className="premium-event-footer"><span className="premium-event-price">{Number(event.fee || 0) > 0 ? `₹${Number(event.fee).toLocaleString("en-IN")}` : "Free"}</span><Link className="button secondary" to={admin ? `/control-center/events/edit/${event._id}` : `/student/events/${event._id}`}>{admin ? "Edit event" : "Event details"}<span aria-hidden="true">↗</span></Link></div>
            </div>
        </article>
    );
}
