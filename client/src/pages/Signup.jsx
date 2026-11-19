
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import AuthShowcase from "../components/AuthShowcase";

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "",
        collegePid: "",
        collegeName: "",
        yearSemester: "",
        mobileNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showResendOtp, setShowResendOtp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resendingOtp, setResendingOtp] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const validateField = (name, value, values = form) => {
        const clean = value.trim();
        if (["fullName", "collegePid", "collegeName", "yearSemester", "mobileNumber", "email", "password", "confirmPassword"].includes(name) && !clean) return "This field is required.";
        if (name === "email" && clean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return "Enter a valid email address.";
        if (name === "mobileNumber" && clean && !/^(\+91[\s-]?)?[6-9][0-9]{9}$/.test(clean)) return "Enter a valid 10-digit mobile number.";
        if (name === "password" && value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value)) return "Password does not meet the requirements below.";
        if (name === "confirmPassword" && value && value !== values.password) return "Passwords do not match.";
        return "";
    };

    const blurField = (e) => {
        const { name, value } = e.target;
        setTouched((previous) => ({ ...previous, [name]: true }));
        setFieldErrors((previous) => ({ ...previous, [name]: validateField(name, value) }));
    };

    const fieldMessage = (name) => (touched[name] || submitted) && fieldErrors[name]
        ? <small className="field-error" role="alert">{fieldErrors[name]}</small>
        : null;

    const change = (e) => {
        const { name, value } = e.target;

        setForm((previous) => {
            const next = {
            ...previous,
            [name]:
                name === "collegePid"
                    ? value.toUpperCase()
                    : name === "email"
                        ? value.toLowerCase()
                        : value,
            };
            if (touched[name] || submitted || name === "confirmPassword") setFieldErrors((errors) => ({ ...errors, [name]: validateField(name, next[name], next) }));
            if (name === "password" && (touched.confirmPassword || submitted || next.confirmPassword)) setFieldErrors((errors) => ({ ...errors, confirmPassword: validateField("confirmPassword", next.confirmPassword, next) }));
            return next;
        });
    };

    const submit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");
        setShowResendOtp(false);
        setSubmitted(true);

        const nextErrors = Object.fromEntries(Object.entries(form).map(([name, value]) => [name, validateField(name, value)]).filter(([, message]) => message));
        setFieldErrors(nextErrors);
        setTouched(Object.fromEntries(Object.keys(form).map((name) => [name, true])));
        if (Object.keys(nextErrors).length) return;

        if (form.password !== form.confirmPassword) {
            setFieldErrors((previous) => ({ ...previous, confirmPassword: "Passwords do not match." }));
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post("/auth/signup", {
                fullName: form.fullName.trim(),
                collegePid: form.collegePid.trim(),
                collegeName: form.collegeName.trim(),
                yearSemester: form.yearSemester.trim(),
                mobileNumber: form.mobileNumber.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                confirmPassword: form.confirmPassword,
            });

            setMessage(
                data.message ||
                "Account created. Please verify your email."
            );
            sessionStorage.setItem("remember-me-after-verification", String(rememberMe));

            // Continue to your existing email verification page.
            navigate(
                `/verify-email?email=${encodeURIComponent(
                    form.email.trim().toLowerCase()
                )}`,
                {
                    state: {
                        message:
                            data.message ||
                            "Enter the OTP sent to your email address.",
                    },
                }
            );
        } catch (err) {
            const status = err.response?.status;
            const responseData = err.response?.data;
            const serverMessage = responseData?.message;

            console.error("Signup error:", {
                status,
                response: responseData,
            });

            setError(
                serverMessage || "Signup failed. Please try again."
            );

            const emailConflict =
                status === 409 &&
                (responseData?.field === "email" ||
                    /email.*(exists|already registered|not verified|not verified)|not verified.*email|request a new otp/i.test(
                        serverMessage || ""
                    ));

            if (emailConflict) {
                setShowResendOtp(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setMessage("");

        const email = form.email.trim().toLowerCase();

        if (!email) {
            setError("Enter your email address first.");
            return;
        }

        setResendingOtp(true);

        try {
            const { data } = await api.post(
                "/auth/resend-verification-otp",
                { email }
            );

            setMessage(
                data.message || "A new verification OTP has been sent."
            );

            navigate(
                `/verify-email?email=${encodeURIComponent(email)}`,
                {
                    state: {
                        message:
                            data.message ||
                            "Enter the new OTP sent to your email.",
                    },
                }
            );
        } catch (err) {
            const serverMessage = err.response?.data?.message;

            setError(
                serverMessage ||
                "Unable to resend OTP. Please try again."
            );

            if (
                /already verified/i.test(serverMessage || "")
            ) {
                setMessage("This email is already verified. Please log in.");
                setShowResendOtp(false);
            }
        } finally {
            setResendingOtp(false);
        }
    };

    return (
        <div className="auth-page auth-page-student">
            <AuthShowcase mode="signup" />
            <form className="form-card wide" onSubmit={submit} noValidate autoComplete="on">
                <h1>Create Student Account</h1>

                <p>
                    Create your student profile and verify your email to
                    register for college events.
                </p>

                {message && (
                    <div className="alert success" role="status">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="alert error" role="alert">
                        {error}
                    </div>
                )}

                <div className="grid-2">
                    <label>
                        Full Name
                        <input
                            name="fullName"
                            required
                            autoComplete="name"
                            value={form.fullName}
                            onChange={change}
                            onBlur={blurField}
                            placeholder="Enter your full name"
                        />
                        {fieldMessage("fullName")}
                    </label>

                    <label>
                        College PID
                        <input
                            name="collegePid"
                            required
                            maxLength={30}
                            value={form.collegePid}
                            onChange={change}
                            onBlur={blurField}
                            placeholder="Enter your college PID"
                        />
                        {fieldMessage("collegePid")}
                        <span className="hint">
                            Enter your unique college/student PID.
                        </span>
                    </label>

                    <label>
                        College/University Name
                        <input
                            name="collegeName"
                            required
                            value={form.collegeName}
                            onChange={change}
                            onBlur={blurField}
                            placeholder="Enter college/university name"
                        />
                        {fieldMessage("collegeName")}
                    </label>

                    <label>
                        Year/Semester
                        <input
                            name="yearSemester"
                            required
                            value={form.yearSemester}
                            onChange={change}
                            onBlur={blurField}
                            placeholder="Example: 3rd Year / 6th Semester"
                        />
                        {fieldMessage("yearSemester")}
                    </label>

                    <label>
                        Mobile Number
                        <input
                            type="tel"
                            name="mobileNumber"
                            required
                            inputMode="numeric"
                            pattern="(\+91[\s-]?)?[6-9][0-9]{9}"
                            title="Enter a valid 10-digit Indian mobile number."
                            value={form.mobileNumber}
                            onChange={change}
                            onBlur={blurField}
                            placeholder="Enter mobile number"
                        />
                        {fieldMessage("mobileNumber")}
                    </label>

                    <label>
                        Email Address
                        <input
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                            value={form.email}
                            onChange={change}
                            onBlur={blurField}
                            placeholder="Enter email address"
                        />
                        {fieldMessage("email")}
                    </label>

                    <label>
                        Password
                        <div className="password-field-wrap">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={form.password}
                                onChange={change}
                                onBlur={blurField}
                                placeholder="Minimum 6 characters"
                            />
                            <button className="password-visibility-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        <span className="hint">Minimum 8 characters, with uppercase and lowercase letters, a number, and a special character.</span>
                        {fieldMessage("password")}
                    </label>

                    <label>
                        Confirm Password
                        <div className="password-field-wrap">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={form.confirmPassword}
                                onChange={change}
                                onBlur={blurField}
                                placeholder="Confirm your password"
                            />
                            <button className="password-visibility-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} aria-pressed={showConfirmPassword}>
                                {showConfirmPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        {form.confirmPassword
                            ? fieldErrors.confirmPassword
                                ? <small className="field-error" role="alert">{fieldErrors.confirmPassword}</small>
                                : <small className="field-success" role="status">Passwords match.</small>
                            : fieldMessage("confirmPassword")}
                    </label>
                </div>

                <label className="remember-me-row">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Remember me when I sign in after verification</span>
                </label>

                <button
                    className="button primary"
                    type="submit"
                    disabled={loading || resendingOtp}
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>

                {showResendOtp && (
                    <div className="resend-otp-section">
                        <p>
                            This email may already have an account. If it is
                            not verified, you can request a new verification OTP.
                        </p>

                        <button
                            className="button"
                            type="button"
                            onClick={handleResendOtp}
                            disabled={loading || resendingOtp}
                        >
                            {resendingOtp
                                ? "Sending OTP..."
                                : "Resend Verification OTP"}
                        </button>
                    </div>
                )}

                <p>
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
}
