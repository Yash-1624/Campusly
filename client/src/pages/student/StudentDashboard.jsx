import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Loading from "../../components/Loading";

export default function StudentDashboard() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([api.get("/events"), api.get("/registrations/my")])
            .then(([eventResponse, registrationResponse]) => {
                if (!active) return;
                setEvents(eventResponse.data.events || []);
                setRegistrations(registrationResponse.data.registrations || []);
            })
            .catch((err) => { if (active) setError(err.response?.data?.message || "Your dashboard could not be loaded."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const [now] = useState(() => new Date());
    const upcoming = useMemo(() => registrations.filter((registration) => registration.event && new Date(registration.event.date) >= now).sort((a, b) => new Date(a.event.date) - new Date(b.event.date)), [registrations, now]);
    const pastCount = registrations.filter((registration) => registration.event && new Date(registration.event.date) < now).length;

    if (loading) return <Loading text="Preparing your dashboard…" />;

    return (
        <div className="dashboard-shell dashboard-shell-student">
        <main className="container student-dashboard-page">
            <section className="dashboard-welcome">
                <div><p className="eyebrow">YOUR CAMPUS, YOUR CALENDAR</p><h1>Good to see you, {user?.fullName?.split(" ")[0] || "there"}.</h1><p>Find your next reason to get together.</p></div>
                <Link className="button primary" to="/student/events">Explore events <span aria-hidden="true">↗</span></Link>
                <span className="welcome-shape" aria-hidden="true">✳</span>
            </section>
            {error && <div className="alert error" role="alert">{error}</div>}
            <section className="dashboard-metrics" aria-label="Your event activity">
                <div className="dashboard-metric"><span className="metric-label">AVAILABLE EVENTS</span><strong>{events.length}</strong><Link to="/student/events">Browse campus events <b>↗</b></Link></div>
                <div className="dashboard-metric"><span className="metric-label">YOUR REGISTRATIONS</span><strong>{registrations.length}</strong><Link to="/student/registrations">View all registrations <b>↗</b></Link></div>
                <div className="dashboard-metric"><span className="metric-label">UPCOMING FOR YOU</span><strong>{upcoming.length}</strong><Link to="/student/registrations">See your schedule <b>↗</b></Link></div>
                <div className="dashboard-metric"><span className="metric-label">PAST REGISTRATIONS</span><strong>{pastCount}</strong><span className="metric-footnote">Past event bookings in your account</span></div>
            </section>

            <section className="dashboard-content-grid">
                <div className="dashboard-panel upcoming-panel">
                    <div className="panel-heading"><div><p className="eyebrow">ON YOUR CALENDAR</p><h2>Coming up</h2></div><Link to="/student/registrations">View schedule ↗</Link></div>
                    {upcoming.length ? <div className="dashboard-event-list">{upcoming.slice(0, 4).map((registration) => <Link className="dashboard-event-row" to={`/student/registrations/${registration._id}`} key={registration._id}>
                        <span className="dashboard-date"><b>{new Date(registration.event.date).toLocaleDateString("en", { day: "2-digit" })}</b><small>{new Date(registration.event.date).toLocaleDateString("en", { month: "short" })}</small></span>
                        <span className="dashboard-event-info"><strong>{registration.event.name}</strong><small>{registration.event.category} · {registration.event.location}</small></span>
                        <span className={`registration-state${String(registration.registrationStatus || "").toLowerCase().includes("pending") ? " is-payment-pending" : ""}`}>{registration.registrationStatus || "Registered"}</span><b className="row-arrow">↗</b>
                    </Link>)}</div> : <div className="dashboard-empty"><span>✳</span><h3>Your calendar is open.</h3><p>Find an event and it’ll show up here.</p><Link to="/student/events">Explore events ↗</Link></div>}
                </div>
                <aside className="dashboard-panel quick-panel"><p className="eyebrow">QUICK LINKS</p><h2>Make it happen.</h2><Link to="/student/events"><span className="quick-icon">✦</span><span><strong>Find an event</strong><small>See what’s happening on campus</small></span><b>↗</b></Link><Link to="/student/profile"><span className="quick-icon">◉</span><span><strong>Your profile</strong><small>Keep your details up to date</small></span><b>↗</b></Link><Link to="/student/registrations"><span className="quick-icon">▤</span><span><strong>Registrations</strong><small>Tickets and booking status</small></span><b>↗</b></Link></aside>
            </section>
        </main>
        </div>
    );
}
