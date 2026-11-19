import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const emailFromUrl =
        searchParams.get("email") || "";

    const [form, setForm] = useState({
        otp: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const change = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    };

    const submit = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");

        if (!emailFromUrl) {

            setError(
                "Email address is missing. Please request a new reset OTP."
            );

            return;
        }

        if (
            form.newPassword !==
            form.confirmPassword
        ) {

            setError(
                "Passwords do not match."
            );

            return;
        }

        if (
            form.newPassword.length < 6
        ) {

            setError(
                "Password must be at least 6 characters long."
            );

            return;
        }

        setLoading(true);

        try {

            const { data } = await api.post(
                "/auth/reset-password",
                {
                    email: emailFromUrl,
                    otp: form.otp,
                    newPassword: form.newPassword,
                    confirmPassword: form.confirmPassword
                }
            );

            setMessage(
                data.message ||
                "Password reset successfully."
            );

            setTimeout(() => {

                navigate("/login");

            }, 1500);

        } catch (err) {

            console.error(
                "Reset password error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to reset password."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="auth-page">

            <form
                className="form-card"
                onSubmit={submit}
            >

                <h1>
                    Reset Password
                </h1>

                <p>
                    Enter the OTP sent to:
                </p>

                <strong>
                    {emailFromUrl}
                </strong>

                {message && (
                    <div className="alert success">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="alert error">
                        {error}
                    </div>
                )}

                <label>
                    OTP

                    <input
                        type="text"
                        name="otp"
                        required
                        maxLength="6"
                        value={form.otp}
                        onChange={change}
                        placeholder="Enter 6-digit OTP"
                    />
                </label>

                <label>
                    New Password

                    <input
                        type="password"
                        name="newPassword"
                        required
                        minLength="6"
                        value={form.newPassword}
                        onChange={change}
                        placeholder="Enter new password"
                    />
                </label>

                <label>
                    Confirm Password

                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        minLength="6"
                        value={form.confirmPassword}
                        onChange={change}
                        placeholder="Confirm new password"
                    />
                </label>

                <button
                    type="submit"
                    className="button primary"
                    disabled={loading}
                >
                    {loading
                        ? "Resetting..."
                        : "Reset Password"}
                </button>

                <p>
                    Remember your password?{" "}

                    <Link to="/login">
                        Login
                    </Link>
                </p>

            </form>

        </div>
    );
}