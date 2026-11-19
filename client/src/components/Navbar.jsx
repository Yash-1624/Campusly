import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const onAdminLogin = location.pathname.startsWith("/control-center");
    const closeMenu = () => setMenuOpen(false);

    const signOut = () => {
        logout();
        navigate(user?.role === "admin" ? "/control-center" : user?.role === "volunteer" ? "/volunteer-access" : "/login", { replace: true });
    };

    const brandTo = !user ? "/" : user.role === "admin"
        ? "/control-center/dashboard"
        : onAdminLogin
            ? "/control-center"
            : user.role === "student"
                ? "/student"
                : user.role === "volunteer"
                    ? "/volunteer/dashboard"
                    : "/login";

    return (
        <header className="navbar">
            <Link className="brand" to={brandTo} onClick={closeMenu} aria-label="Campusly home">
                <span className="navbar-brand-name">Campusly</span>
            </Link>

            <button
                className={`navbar-menu-toggle${menuOpen ? " is-open" : ""}`}
                type="button"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
            ><span /><span /></button>

            {!user && <nav className={`guest-nav${menuOpen ? " is-open" : ""}`}>
                <a href="/#explore" onClick={closeMenu}>Explore</a>
                <a href="/#how-it-works" onClick={closeMenu}>How it works</a>
                <Link className="guest-login" to="/login" onClick={closeMenu}>Log in</Link>
                <ThemeToggle />
                <Link className="button primary guest-cta" to="/signup" onClick={closeMenu}>Create account <span aria-hidden="true">↗</span></Link>
            </nav>}

            {user?.role === "student" && <nav className={menuOpen ? "is-open" : ""}>
                <Link to="/student" onClick={closeMenu}>Dashboard</Link>
                <Link to="/student/events" onClick={closeMenu}>Events</Link>
                <Link to="/student/registrations" onClick={closeMenu}>My Registrations</Link>
                <Link to="/student/profile" onClick={closeMenu}>Profile</Link>
                <ThemeToggle />
                <button className="link-button" onClick={() => { closeMenu(); signOut(); }}>Logout</button>
            </nav>}

            {user?.role === "volunteer" && <nav className={menuOpen ? "is-open" : ""}>
                <Link to="/volunteer/dashboard" onClick={closeMenu}>Scanner</Link>
                <ThemeToggle />
                <button className="link-button" onClick={() => { closeMenu(); signOut(); }}>Logout</button>
            </nav>}

            {user?.role === "admin" && <nav className={menuOpen ? "is-open" : ""}>
                <Link to="/control-center/dashboard" onClick={closeMenu}>Dashboard</Link>
                <Link to="/control-center/events" onClick={closeMenu}>Events</Link>
                <Link to="/control-center/categories" onClick={closeMenu}>Categories</Link>
                <Link to="/control-center/registrations" onClick={closeMenu}>Registrations</Link>
                <Link to="/control-center/students" onClick={closeMenu}>Students</Link>
                <Link to="/control-center/payments" onClick={closeMenu}>Payments</Link>
                <Link to="/control-center/volunteers" onClick={closeMenu}>Volunteers</Link>
                <Link to="/control-center/entries" onClick={closeMenu}>Entry Log</Link>
                <ThemeToggle />
                <button className="link-button" onClick={() => { closeMenu(); signOut(); }}>Logout</button>
            </nav>}
        </header>
    );
}
