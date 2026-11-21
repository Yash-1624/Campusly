import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

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

function MobileNavIcon({ name }) {
    const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
    const icons = {
        home: <><path d="m3.5 10 8.5-7 8.5 7" /><path d="M5.5 9v11h13V9M9.5 20v-6h5v6" /></>,
        events: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M7.5 3v4m9-4v4M4 9.5h16m-12 4h2m3 0h2m-7 3.5h2" /></>,
        registrations: <><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
        profile: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
        payments: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5c-.6-.8-1.6-1.2-3-1.2-1.7 0-2.8.8-2.8 2s1 1.8 2.6 2.2l.9.2c1.7.4 2.6 1.1 2.6 2.3 0 1.3-1.2 2.2-3.1 2.2-1.4 0-2.7-.5-3.4-1.5M12 5.5v13" /></>,
        more: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    };
    return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>{icons[name] || icons.registrations}</svg>;
}

function SidebarIcon({ label }) {
    const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
    const paths = {
        home: <><path d="m3.5 10 8.5-7 8.5 7"/><path d="M5.5 9v11h13V9M9.5 20v-6h5v6"/></>,
        events: <><path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
        create: <><path d="M12 5v14M5 12h14"/></>,
        registrations: <><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
        people: <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20v-1a5.5 5.5 0 0 1 11 0v1M16 5.5a3 3 0 0 1 0 5.8m1.5 3a4 4 0 0 1 3 3.9v1"/></>,
        categories: <><path d="m12 3 9 9-9 9-9-9 9-9Z"/><circle cx="12" cy="12" r="2"/></>,
        payments: <><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5c-.6-.8-1.6-1.2-3-1.2-1.7 0-2.8.8-2.8 2s1 1.8 2.6 2.2l.9.2c1.7.4 2.6 1.1 2.6 2.3 0 1.3-1.2 2.2-3.1 2.2-1.4 0-2.7-.5-3.4-1.5M12 5.5v13"/></>,
        entry: <><path d="m5 12 4.5 4.5L19 7"/><circle cx="12" cy="12" r="9"/></>,
        insights: <><path d="M4 19V5m0 14h16"/><path d="m7 15 4-4 3 2 5-6"/><path d="M16 7h3v3"/></>,
        logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/></>,
        more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    };
    const normalized = label.toLowerCase();
    const key = label === "Overview" ? "home" : label === "Create event" ? "create" : normalized.includes("registration") ? "registrations" : normalized.includes("student") || normalized.includes("volunteer") ? "people" : normalized.includes("categor") ? "categories" : normalized.includes("payment") ? "payments" : normalized.includes("entry") ? "entry" : normalized.includes("insight") ? "insights" : normalized.includes("event") ? "events" : normalized.includes("out") ? "logout" : "more";
    return <svg className="sidebar-icon-svg" viewBox="0 0 24 24" aria-hidden="true" {...common}>{paths[key]}</svg>;
}

export default function DashboardSidebar({ role }) {
    const [collapsed, setCollapsed] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const links = navigation[role] || [];
    const primaryLinks = role === "admin"
        ? [navigation.admin[0], navigation.admin[1], navigation.admin[3], navigation.admin[6]]
        : [navigation.student[0], navigation.student[1], navigation.student[2], navigation.student[3]];
    const moreLinks = links.filter((item) => !primaryLinks.includes(item));
    const moreActive = moreLinks.some(([to, , , exact]) => exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`));
    const isLinkActive = (to, exact = false) => exact
        ? location.pathname === to
        : location.pathname === to || location.pathname.startsWith(`${to}/`);

    const signOut = () => {
        logout();
        navigate(role === "admin" ? "/control-center" : "/login", { replace: true });
    };

    return (
        <>
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
                {links.map(([to, label, , exact]) => (
                    <NavLink key={to} to={to} end={exact} title={collapsed ? label : undefined}>
                        <span className="dashboard-sidebar-icon" aria-hidden="true"><SidebarIcon label={label} /></span>
                        <span className="dashboard-sidebar-link-label">{label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="dashboard-sidebar-bottom">
                <div className="dashboard-sidebar-user">
                    <span className="dashboard-sidebar-avatar">{user?.fullName?.trim()?.charAt(0)?.toUpperCase() || (role === "admin" ? "A" : "S")}</span>
                    <span className="dashboard-sidebar-user-text"><strong>{user?.fullName || (role === "admin" ? "Administrator" : "Student")}</strong><small>{role === "admin" ? "Administrator" : "Student account"}</small></span>
                </div>
                <ThemeToggle compact={collapsed} className="dashboard-sidebar-theme-toggle" />
                <button type="button" className="dashboard-sidebar-logout" onClick={signOut} title={collapsed ? "Log out" : undefined}>
                    <span className="dashboard-sidebar-icon" aria-hidden="true">↪</span><span className="dashboard-sidebar-link-label">Log out</span>
                </button>
            </div>
        </aside>
        <nav className="mobile-bottom-nav" aria-label={`${role} mobile navigation`}>
            {primaryLinks.map(([to, label, , exact]) => (
                <button key={to} type="button" className={`mobile-bottom-item${isLinkActive(to, exact) ? " active" : ""}`} aria-current={isLinkActive(to, exact) ? "page" : undefined} onClick={() => { setMoreOpen(false); navigate(to); }}>
                    <span className="mobile-bottom-icon"><MobileNavIcon name={label === "Overview" ? "home" : label.includes("events") || label.includes("Events") ? "events" : label.includes("profile") ? "profile" : label.includes("Payments") ? "payments" : "registrations"} /></span>
                    <span>{label === "Overview" ? "Home" : label === "Manage events" ? "Events" : label === "My registrations" ? "My events" : label}</span>
                </button>
            ))}
            <button type="button" className={`mobile-bottom-item mobile-more-trigger${moreOpen || moreActive ? " active" : ""}`} aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((open) => !open)}>
                <span className="mobile-bottom-icon"><MobileNavIcon name="more" /></span><span>More</span>
            </button>
        </nav>
        {moreOpen && <>
            <button className="mobile-more-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMoreOpen(false)} />
            <section className="mobile-more-menu" role="menu" aria-label="More navigation">
                <div className="mobile-more-heading"><strong>{role === "admin" ? "Admin workspace" : "Your account"}</strong><button type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu">×</button></div>
                {moreLinks.map(([to, label, , exact]) => <button key={to} type="button" className={`mobile-more-link${isLinkActive(to, exact) ? " active" : ""}`} aria-current={isLinkActive(to, exact) ? "page" : undefined} role="menuitem" onClick={() => { setMoreOpen(false); navigate(to); }}><span aria-hidden="true"><SidebarIcon label={label} /></span>{label}</button>)}
                <ThemeToggle className="mobile-more-theme" />
                <button type="button" role="menuitem" className="mobile-more-logout" onClick={signOut}><span aria-hidden="true"><SidebarIcon label="Log out" /></span>Log out</button>
            </section>
        </>}
        </>
    );
}
