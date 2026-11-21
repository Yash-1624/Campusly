import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShowcase from "../components/AuthShowcase";

export default function Login({ adminMode = false, volunteerMode = false }) {
    const { login, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => sessionStorage.getItem("remember-me-after-verification") !== "false");
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});

    const validateLoginField = (name, value) => {
        if (!value.trim()) return "This field is required.";
        if (name === "email" && !volunteerMode && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address.";
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((current) => ({ ...current, [name]: value }));
        if (touched[name]) setFieldErrors((current) => ({ ...current, [name]: validateLoginField(name, value) }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        const nextErrors = { email: validateLoginField("email", form.email), password: validateLoginField("password", form.password) };
        setFieldErrors(nextErrors);
        setTouched({ email: true, password: true });
        if (Object.values(nextErrors).some(Boolean)) return;
        setLoading(true);

        try {
            const portal = adminMode ? "admin" : volunteerMode ? "volunteer" : "student";
            const data = await login(form.email.trim().toLowerCase(), form.password, rememberMe, portal);
            const expectedRole = adminMode ? "admin" : volunteerMode ? "volunteer" : "student";

            if (data.user.role !== expectedRole) {
                logout();
                setError(
                    adminMode
                        ? "These credentials do not belong to an administrator account."
                        : volunteerMode
                            ? "These credentials do not belong to a volunteer account."
                            : "Administrator and volunteer accounts must sign in through their separate portals."
                );
                return;
            }

            const requestedPath = searchParams.get("next") || "";
            const safeStudentPath = /^\/student\/events(?:\/[a-f\d]{24})?$/i.test(requestedPath);
            navigate(adminMode ? "/control-center/dashboard" : volunteerMode ? "/volunteer/dashboard" : safeStudentPath ? requestedPath : "/student", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    const tiltLoginCard = (event) => {
        if (adminMode || volunteerMode || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        event.currentTarget.style.setProperty("--login-tilt-x", `${y * -4}deg`);
        event.currentTarget.style.setProperty("--login-tilt-y", `${x * 5}deg`);
        event.currentTarget.style.setProperty("--login-glow-x", `${(x + 0.5) * 100}%`);
        event.currentTarget.style.setProperty("--login-glow-y", `${(y + 0.5) * 100}%`);
        event.currentTarget.classList.add("is-tilting");
    };

    const resetLoginCard = (event) => {
        event.currentTarget.classList.remove("is-tilting");
        event.currentTarget.style.removeProperty("--login-tilt-x");
        event.currentTarget.style.removeProperty("--login-tilt-y");
        event.currentTarget.style.removeProperty("--login-glow-x");
        event.currentTarget.style.removeProperty("--login-glow-y");
    };

    const tiltAdminBoard = (event) => {
        if (event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        event.currentTarget.style.setProperty("--board-tilt-x", `${y * -7}deg`);
        event.currentTarget.style.setProperty("--board-tilt-y", `${x * 9}deg`);
        event.currentTarget.style.setProperty("--board-glow-x", `${(x + 0.5) * 100}%`);
        event.currentTarget.style.setProperty("--board-glow-y", `${(y + 0.5) * 100}%`);
        event.currentTarget.classList.add("is-tilting");
    };

    const resetAdminBoard = (event) => {
        event.currentTarget.classList.remove("is-tilting");
        ["--board-tilt-x", "--board-tilt-y", "--board-glow-x", "--board-glow-y"].forEach((property) => event.currentTarget.style.removeProperty(property));
    };

    return (
        <div className={`auth-page${adminMode ? " auth-page-admin" : !adminMode && !volunteerMode ? " auth-page-student" : ""}`}>
            {adminMode && <aside className="admin-auth-showcase" aria-label="Admin workspace introduction">
                <span className="admin-auth-orbit admin-auth-orbit-one" aria-hidden="true" />
                <span className="admin-auth-orbit admin-auth-orbit-two" aria-hidden="true" />
                <p className="admin-auth-kicker"><span /> CAMPUSLY CONTROL CENTER</p>
                <h2>Make every<br />campus moment<br /><em>count.</em></h2>
                <p className="admin-auth-copy">Your events, people, and activity — all in one place.</p>
                <div className="admin-control-preview" onPointerMove={tiltAdminBoard} onPointerLeave={resetAdminBoard} aria-label="Interactive preview of the admin dashboard">
                    <div className="admin-preview-board">
                        <div className="admin-preview-topbar"><span className="admin-preview-brand-mark">C</span><strong>Campusly</strong><span className="admin-preview-live"><i /> LIVE</span><span className="admin-preview-avatar">A</span></div>
                        <div className="admin-preview-content">
                            <div className="admin-preview-greeting"><span>MONDAY, NOVEMBER 21</span><strong>Your campus<br />is in motion.</strong><small>Everything happening, at a glance.</small><b>↗</b></div>
                            <div className="admin-preview-stats"><div><span className="preview-stat-icon violet">✳</span><small>EVENTS</small><strong>12</strong><i>+3 this month</i></div><div><span className="preview-stat-icon blue">♧</span><small>STUDENTS</small><strong>248</strong><i>+18 this week</i></div><div><span className="preview-stat-icon mint">▱</span><small>TICKETS</small><strong>86</strong><i>On track</i></div></div>
                            <div className="admin-preview-bottom"><div className="preview-activity"><span>WEEKLY ACTIVITY</span><strong>Engagement is up <b>18%</b></strong><div className="preview-bars"><i/><i/><i/><i/><i/><i/><i/></div></div><div className="preview-next-event"><span className="preview-event-art">✦</span><span><small>UP NEXT</small><strong>Diwali Night</strong><i>Today · 6:30 PM</i></span><b>↗</b></div></div>
                        </div>
                    </div>
                    <span className="admin-preview-float float-registrations"><b>↗</b><span><strong>+24</strong><small>registrations</small></span></span>
                    <span className="admin-preview-float float-live"><i /> Events are live</span>
                </div>
                <div className="admin-auth-foot"><span className="admin-auth-foot-icon">✦</span><span><strong>One clear view</strong><small>Run your campus events with confidence</small></span><span className="admin-auth-foot-arrow">↗</span></div>
            </aside>}
            {!adminMode && !volunteerMode && <AuthShowcase mode="login" />}
            <form className={`form-card${!adminMode && !volunteerMode ? " login-card-3d" : adminMode ? " admin-login-card" : ""}`} onSubmit={submit} onPointerMove={tiltLoginCard} onPointerLeave={resetLoginCard} noValidate autoComplete="on">
                <p className="login-brand-name">Campusly</p>
                <p className="login-eyebrow">{adminMode ? "ADMINISTRATOR ACCESS" : volunteerMode ? "VOLUNTEER ACCESS" : "CAMPUS EVENTS, ALL IN ONE PLACE"}</p>
                <h1>{adminMode ? "Administrator Sign In" : volunteerMode ? "Volunteer Sign In" : "Welcome back"}</h1>
                <p className="login-intro">
                    {adminMode
                        ? "Authorized administrators only. Sign in to manage the event system."
                        : volunteerMode
                            ? "Use the Volunteer Login ID and password provided by the administrator."
                            : "Sign in to explore college events and manage your registrations."}
                </p>

                {error && <div className="alert error" role="alert">{error}</div>}

                <label>
                    {volunteerMode ? "Volunteer Login ID" : "Email Address"}
                    <input
                        type={volunteerMode ? "text" : "email"}
                        name="email"
                        required
                        autoComplete="username"
                        value={form.email}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder={volunteerMode ? "Enter your volunteer login ID" : "Enter your email"}
                        onBlur={(e) => { setTouched((current) => ({ ...current, email: true })); setFieldErrors((current) => ({ ...current, email: validateLoginField("email", e.target.value) })); }}
                    />
                    {touched.email && fieldErrors.email && <small className="field-error" role="alert">{fieldErrors.email}</small>}
                </label>

                <label>
                    Password
                    <div className="password-field-wrap">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            autoComplete="current-password"
                            value={form.password}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Enter your password"
                            onBlur={(e) => { setTouched((current) => ({ ...current, password: true })); setFieldErrors((current) => ({ ...current, password: validateLoginField("password", e.target.value) })); }}
                        />
                        <button className="password-visibility-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                    {touched.password && fieldErrors.password && <small className="field-error" role="alert">{fieldErrors.password}</small>}
                </label>

                <label className="remember-me-row">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Remember me on this device</span>
                </label>

                <button
                    type="submit"
                    className="button primary login-submit"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : adminMode ? "Sign in to Admin Portal" : volunteerMode ? "Sign in to Volunteer Portal" : "Login"}
                </button>

                {!volunteerMode && <p><Link to="/forgot-password">Forgot Password?</Link></p>}

                {!adminMode && !volunteerMode && (
                    <p>
                        New student? <Link to="/signup">Create Account</Link>
                    </p>
                )}
            </form>
        </div>
    );
}
