import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Loading from "../../components/Loading";
import DashboardSidebar from "../../components/DashboardSidebar";
import "./AdminDashboard.css";

const metricLabels = [
    ["totalStudents", "Students", "◉"],
    ["totalEvents", "All events", "✳"],
    ["activeEvents", "Published", "◈"],
    ["upcomingEvents", "Upcoming", "◷"],
    ["totalRegistrations", "Registrations", "▤"],
    ["successfulPayments", "Paid", "✓"],
    ["pendingPayments", "Payments pending", "◌"],
];

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
        <DashboardSidebar role="admin" />
        <main className="container admin-dashboard-page">
            <section className="admin-welcome">
                <div><p className="eyebrow">CAMPUS EVENTS / CONTROL CENTER</p><h1>Good day, {user?.fullName?.split(" ")[0] || "Admin"}.</h1><p>Your events, registrations, and campus activity at a glance.</p></div>
                <Link className="button primary" to="/control-center/events/add">Create an event <span aria-hidden="true">↗</span></Link>
            </section>
            {error && <div className="alert error" role="alert">{error}</div>}
            <section className="admin-metrics" aria-label="Event system statistics">{metricLabels.map(([key, label, icon]) => <article className="admin-metric" key={key}><span className="admin-metric-icon" aria-hidden="true">{icon}</span><div><small>{label}</small><strong>{Number(stats[key] || 0).toLocaleString()}</strong></div></article>)}</section>
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
