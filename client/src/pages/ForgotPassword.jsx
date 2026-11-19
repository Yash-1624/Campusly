import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Please enter your registered email address.");
            return;
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setError("");
        setMessage("");
        setLoading(true);

        try {
            const { data } = await api.post(
                "/auth/forgot-password",
                { email: normalizedEmail },
                { timeout: 20000 }
            );

            console.log("Forgot password response:", data);

            const successMessage =
                data.message || "Password reset OTP sent successfully. Please check your email.";

            setMessage(successMessage);

            // Navigate after short delay so user can see the success message
            setTimeout(() => {
                navigate(
                    `/reset-password?email=${encodeURIComponent(normalizedEmail)}`,
                    {
                        state: {
                            message: successMessage,
                        },
                    }
                );
            }, 1200);
        } catch (err) {
            console.error(
                "Forgot password error:",
                err.response?.data || err.message
            );

            if (err.code === "ECONNABORTED") {
                setError(
                    "The request timed out. Please check the backend email service and try again."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to send reset OTP. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form className="form-card" onSubmit={submit} noValidate>
                <h1>Forgot Password</h1>

                <p>
                    Enter your registered email address.
                    We will send you a password reset OTP.
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

                <label>
                    Email Address
                    <input
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        disabled={loading}
                    />
                </label>

                <button
                    type="submit"
                    className="button primary"
                    disabled={loading || !email.trim()}
                >
                    {loading ? "Sending..." : "Send Reset OTP"}
                </button>

                <p>
                    Remember your password?{" "}
                    <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
}