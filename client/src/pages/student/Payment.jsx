import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";

export default function Payment() {
    const { registrationId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const orderRequest = useRef(null);

    // ========================================
    // LOAD RAZORPAY ORDER
    // ========================================
    useEffect(() => {
        let cancelled = false;

        if (!registrationId) {
            setError("Registration ID is missing.");
            return undefined;
        }

        const requestKey = `${registrationId}:${attempt}`;
        if (orderRequest.current?.key !== requestKey) {
            orderRequest.current = {
                key: requestKey,
                promise: api.post("/payments/create", { registrationId }).then(({ data: result }) => result),
            };
        }

        setError("");
        orderRequest.current.promise
            .then((result) => {
                if (cancelled) return;
                if (!result?.success) throw new Error(result?.message || "Could not create payment.");
                if (result.freeEvent) {
                    navigate(`/student/registration-success/${registrationId}`, { replace: true });
                    return;
                }
                if (!result.registration || !result.payment || !result.razorpay?.orderId || !result.razorpay?.keyId) {
                    throw new Error("Payment response is incomplete. Please refresh and try again.");
                }
                setData(result);
            })
            .catch((err) => {
                console.error("Payment order error:", err);
                if (!cancelled) setError(err.response?.data?.message || err.message || "Could not create payment.");
            });

        return () => { cancelled = true; };
    }, [registrationId, navigate, attempt]);

    // ========================================
    // LOAD RAZORPAY CHECKOUT SCRIPT
    // ========================================
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const existingScript = document.querySelector(
                'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            );

            if (existingScript) {
                existingScript.addEventListener("load", () => resolve(true), {
                    once: true,
                });
                existingScript.addEventListener("error", () => resolve(false), {
                    once: true,
                });
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // ========================================
    // OPEN RAZORPAY CHECKOUT
    // ========================================
    const payNow = async () => {
        try {
            setProcessing(true);
            setError("");

            if (
                !data?.registration ||
                !data?.payment ||
                !data?.razorpay?.orderId ||
                !data?.razorpay?.keyId
            ) {
                throw new Error(
                    "Payment information is missing. Please refresh the page."
                );
            }

            const loaded = await loadRazorpay();

            if (!loaded || !window.Razorpay) {
                throw new Error("Razorpay Checkout could not be loaded.");
            }

            const registration = data.registration;
            const event = registration.event || {};
            const studentInfo = registration.studentInformation || {};
            const contactInfo = registration.contactInformation || {};

            const options = {
                key: data.razorpay.keyId,
                amount: data.razorpay.amount,
                currency: data.razorpay.currency || "INR",
                name: "Campusly",
                description: `Event Registration - ${event.name || "Event"}`,
                order_id: data.razorpay.orderId,

                prefill: {
                    name: studentInfo.fullName || "",
                    email: contactInfo.email || "",
                },

                notes: {
                    registrationId,
                },

                theme: {
                    color: "#172033",
                },

                handler: async (response) => {
                    try {
                        setProcessing(true);
                        setError("");

                        const result = await api.post("/payments/verify", {
                            registrationId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (result.data?.success) {
                            navigate(
                                `/student/registration-success/${registrationId}`,
                                { replace: true }
                            );
                        } else {
                            throw new Error(
                                result.data?.message || "Payment verification failed."
                            );
                        }
                    } catch (verificationError) {
                        console.error("Payment verification error:", verificationError);

                        setError(
                            verificationError.response?.data?.message ||
                            verificationError.message ||
                            "Payment verification failed."
                        );
                        setProcessing(false);
                    }
                },

                modal: {
                    ondismiss: () => {
                        setProcessing(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", (response) => {
                console.error("Razorpay payment failed:", response);

                setError(
                    response.error?.description || "Payment failed. Please try again."
                );
                setProcessing(false);
            });

            razorpay.open();
        } catch (err) {
            console.error("Razorpay error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to open Razorpay."
            );
            setProcessing(false);
        }
    };

    // ========================================
    // ERROR STATE (when order creation fails)
    // ========================================
    if (error && !data) {
        return (
            <main className="container narrow">
                <div className="form-card">
                    <div className="alert error" role="alert">
                        {error}
                    </div>

                    <div className="payment-error-actions">
                        <button type="button" className="button primary" onClick={() => { setData(null); setError(""); setAttempt((value) => value + 1); }}>Try again</button>
                        <button type="button" className="button secondary" onClick={() => navigate("/student")}>Back to Dashboard</button>
                    </div>
                </div>
            </main>
        );
    }

    // ========================================
    // LOADING STATE
    // ========================================
    if (!data) {
        return <Loading />;
    }

    const registration = data.registration || {};
    const event = registration.event || {};
    const studentInfo = registration.studentInformation || {};

    // ========================================
    // PAYMENT PAGE
    // ========================================
    return (
        <main className="container narrow">
            <div className="form-card">
                <div className="test-banner">Razorpay Test Mode</div>

                <h1>Event Payment</h1>

                <p>
                    <span className="payment-summary-label">Event</span> {event.name || "Event"}
                </p>

                <p>
                    <span className="payment-summary-label">Student</span> {studentInfo.fullName || "Student"}
                </p>

                <p>
                    <span className="payment-summary-label">Registration ID</span>{" "}
                    {registration.registrationId || registrationId}
                </p>

                <p className="amount">₹{data.payment?.amount ?? 0}</p>

                {error && (
                    <div className="alert error" role="alert">
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    className="button primary"
                    disabled={processing}
                    onClick={payNow}
                >
                    {processing ? "Processing..." : "Pay with Razorpay"}
                </button>

                <p className="hint">
                    Razorpay Checkout supports available payment methods such as UPI.
                    Supported checkout flows may allow customers to scan a QR code using a
                    UPI app.
                </p>
            </div>
        </main>
    );
}
