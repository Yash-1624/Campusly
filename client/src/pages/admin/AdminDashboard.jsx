import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Loading from "../../components/Loading";
import "./AdminDashboard.css";

const metricLabels = [
    ["totalStudents", "Students", "people"],
    ["totalEvents", "All events", "calendar"],
    ["activeEvents", "Published", "spark"],
    ["upcomingEvents", "Upcoming", "clock"],
    ["totalRegistrations", "Registrations", "ticket"],
    ["successfulPayments", "Paid", "check"],
    ["pendingPayments", "Payments pending", "pending"],
];

function AdminDashboardIcon({ name }) {
    const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
    const icons = {
        people: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-1a5.5 5.5 0 0 1 11 0v1M16 5.5a3 3 0 0 1 0 5.8m1.5 3a4 4 0 0 1 3 3.9v1"/></>,
        calendar: <><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 9.5h16M8 13h3m-3 3.5h3m3-3.5h2"/></>,
        spark: <><path d="m12 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
        clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
        ticket: <><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16a2 2 0 0 0 0-4v-2a2 2 0 0 0 0-4z"/><path d="M12 7v2m0 3v2m0 3v1"/></>,
        check: <><circle cx="12" cy="12" r="9"/><path d="m7.5 12.5 3 3 6-7"/></>,
        pending: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    };
    return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>{icons[name] || icons.spark}</svg>;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentRegistrations, setRecentRegistrations] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.allSettled([api.get("/admin/stats"), api.get("/registrations/admin/all")])
            .then(([statsResult, registrationsResult]) => {
                if (!active) return;
                if (statsResult.status === "fulfilled") setStats(statsResult.value.data.stats);
                else { setStats({}); setError(statsResult.reason.response?.data?.message || "Dashboard statistics could not be loaded."); }
                if (registrationsResult.status === "fulfilled") setRecentRegistrations((registrationsResult.value.data.registrations || []).slice(0, 5));
                else setError((current) => current || "Recent registrations could not be loaded.");
            })
            .catch((err) => { if (active) { setError(err.message || "Dashboard data could not be loaded."); setStats({}); } });
        return () => { active = false; };
    }, []);

    if (!stats) return <Loading text="Loading admin overview…" />;

    return (
        <div className="dashboard-shell dashboard-shell-admin">
        <main className="container admin-dashboard-page">
            <section className="admin-welcome">
                <div><p className="eyebrow">CAMPUS EVENTS / CONTROL CENTER</p><h1>Good day, {user?.fullName?.split(" ")[0] || "Admin"}.</h1><p>Your events, registrations, and campus activity at a glance.</p></div>
                <Link className="button primary" to="/control-center/events/add">Create an event <span aria-hidden="true">↗</span></Link>
            </section>
            {error && <div className="alert error" role="alert">{error}</div>}
            <section className="admin-metrics" aria-label="Event system statistics">{metricLabels.map(([key, label, icon]) => <article className={`admin-metric${key === "pendingPayments" ? " is-payment-pending" : ""}`} key={key}><span className="admin-metric-icon"><AdminDashboardIcon name={icon} /></span><div><small>{label}</small><strong>{Number(stats[key] || 0).toLocaleString()}</strong></div></article>)}</section>
            <section className="admin-dashboard-lower">
                <div className="dashboard-panel admin-activity-panel"><div className="panel-heading"><div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent registrations</h2></div><Link to="/control-center/registrations">View all ↗</Link></div>
                    {recentRegistrations.length ? <div className="admin-activity-list">{recentRegistrations.map((registration) => <div className="admin-activity-row" key={registration._id}><span className="activity-avatar">{registration.student?.fullName?.slice(0, 1) || "S"}</span><span className="activity-description"><strong>{registration.student?.fullName || "Student"}</strong><small>registered for {registration.event?.name || "an event"}</small></span><span className="activity-date">{registration.createdAt ? new Date(registration.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}</span></div>)}</div> : <div className="dashboard-empty compact"><span>▤</span><h3>No registrations yet</h3><p>New activity will appear here.</p></div>}
                </div>
                <aside className="dashboard-panel admin-quick-panel"><p className="eyebrow">WORKSPACE</p><h2>Manage your campus.</h2><Link to="/control-center/events"><span>✳</span>Events & categories<b>↗</b></Link><Link to="/control-center/students"><span>◉</span>Students & volunteers<b>↗</b></Link><Link to="/control-center/entries"><span>⌖</span>Entry log<b>↗</b></Link><Link to="/control-center/payments"><span>₹</span>Payments<b>↗</b></Link></aside>
            </section>
        </main>
        </div>
    );
}
