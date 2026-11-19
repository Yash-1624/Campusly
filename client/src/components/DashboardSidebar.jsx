import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = {
    student: [
        ["/student", "Overview", "⌂", true],
        ["/student/events", "Discover events", "✳"],
        ["/student/registrations", "My registrations", "▤"],
        ["/student/profile", "My profile", "◉"],
    ],
    admin: [
        ["/control-center/dashboard", "Overview", "⌂", true],
        ["/control-center/events", "Manage events", "✳"],
        ["/control-center/events/add", "Create event", "+"],
        ["/control-center/registrations", "Registrations", "▤"],
        ["/control-center/students", "Students", "◉"],
        ["/control-center/categories", "Categories", "◇"],
        ["/control-center/payments", "Payments", "$"],
        ["/control-center/volunteers", "Volunteers", "♧"],
        ["/control-center/entries", "Entry log", "✓"],
        ["/control-center/insights", "Site insights", "◷"],
    ],
};

export default function DashboardSidebar({ role }) {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const links = navigation[role] || [];

    const signOut = () => {
        logout();
        navigate(role === "admin" ? "/control-center" : "/login", { replace: true });
    };

    return (
        <aside className={`dashboard-sidebar${collapsed ? " is-collapsed" : ""}`} aria-label={`${role} workspace navigation`}>
            <div className="dashboard-sidebar-brand-row">
                <Link className="dashboard-sidebar-brand" to={role === "admin" ? "/control-center/dashboard" : "/student"} title="Campusly">
                    <span className="dashboard-sidebar-brand-text">Campusly</span>
                </Link>
                <button type="button" className="dashboard-sidebar-toggle" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                    {collapsed ? "»" : "«"}
                </button>
            </div>
            <p className="dashboard-sidebar-label">{role === "admin" ? "ADMIN WORKSPACE" : "STUDENT SPACE"}</p>
            <nav className="dashboard-sidebar-links">
                {links.map(([to, label, icon, exact]) => (
                    <NavLink key={to} to={to} end={exact} title={collapsed ? label : undefined}>
                        <span className="dashboard-sidebar-icon" aria-hidden="true">{icon}</span>
                        <span className="dashboard-sidebar-link-label">{label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="dashboard-sidebar-bottom">
                <div className="dashboard-sidebar-user">
                    <span className="dashboard-sidebar-avatar">{user?.fullName?.trim()?.charAt(0)?.toUpperCase() || (role === "admin" ? "A" : "S")}</span>
                    <span className="dashboard-sidebar-user-text"><strong>{user?.fullName || (role === "admin" ? "Administrator" : "Student")}</strong><small>{role === "admin" ? "Administrator" : "Student account"}</small></span>
                </div>
                <button type="button" className="dashboard-sidebar-logout" onClick={signOut} title={collapsed ? "Log out" : undefined}>
                    <span className="dashboard-sidebar-icon" aria-hidden="true">↪</span><span className="dashboard-sidebar-link-label">Log out</span>
                </button>
            </div>
        </aside>
    );
}
