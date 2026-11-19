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

    return (
        <div className={`auth-page${!adminMode && !volunteerMode ? " auth-page-student" : ""}`}>
            {!adminMode && !volunteerMode && <AuthShowcase mode="login" />}
            <form className={`form-card${!adminMode && !volunteerMode ? " login-card-3d" : ""}`} onSubmit={submit} onPointerMove={tiltLoginCard} onPointerLeave={resetLoginCard} noValidate autoComplete="on">
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
