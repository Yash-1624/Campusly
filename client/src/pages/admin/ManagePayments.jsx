import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const getEvent = (payment) =>
    payment?.event || payment?.registration?.event || null;

const getStudent = (payment) => payment?.student || null;

const getStatus = (payment) => {
    const value = String(payment?.status || "Unknown").toLowerCase();

    if (["successful", "success", "paid", "completed"].includes(value)) {
        return "successful";
    }

    if (["pending", "created", "processing"].includes(value)) {
        return "pending";
    }

    if (["failed", "failure", "cancelled", "canceled"].includes(value)) {
        return "failed";
    }

    return "other";
};

const displayStatus = (payment) => {
    const status = getStatus(payment);
    if (status === "successful") return "Successful";
    if (status === "pending") return "Pending";
    if (status === "failed") return "Failed";
    return payment?.status || "Unknown";
};

const formatCurrency = (amount, currency = "INR") => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) return "—";

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency || "INR",
            maximumFractionDigits: 2,
        }).format(numericAmount);
    } catch {
        return `₹${numericAmount.toLocaleString("en-IN")}`;
    }
};

const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getTransactionId = (payment) =>
    payment?.transactionId ||
    payment?.razorpayPaymentId ||
    payment?.paymentId ||
    payment?._id ||
    "—";

const getRegistrationId = (payment) =>
    payment?.registration?.registrationId ||
    payment?.registration?._id ||
    (typeof payment?.registration === "string" ? payment.registration : "") ||
    "—";

export default function ManagePayments() {
    const [payments, setPayments] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadPayments = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/admin/payments");
            const data = response?.data;

            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.payments)
                    ? data.payments
                    : Array.isArray(data?.data)
                        ? data.data
                        : [];

            setPayments(list);
        } catch (requestError) {
            console.error("Failed to load admin payments:", requestError);
            setPayments([]);
            setError(
                requestError?.response?.data?.message ||
                "Unable to load payments. Please refresh and try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadPayments();
    }, [loadPayments]);

    const filteredPayments = useMemo(() => {
        const query = search.trim().toLowerCase();

        return payments.filter((payment) => {
            const student = getStudent(payment);
            const event = getEvent(payment);
            const registrationId = getRegistrationId(payment);
            const transactionId = getTransactionId(payment);

            const searchableText = [
                transactionId,
                registrationId,
                student?.fullName,
                student?.name,
                student?.email,
                student?.collegePid,
                student?.collegeName,
                event?.name,
                event?.category,
                payment?.paymentMethod,
                payment?.gateway,
                payment?.razorpayOrderId,
                payment?.razorpayPaymentId,
                payment?.status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = !query || searchableText.includes(query);
            const matchesStatus =
                statusFilter === "all" || getStatus(payment) === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [payments, search, statusFilter]);

    const stats = useMemo(() => {
        const successful = payments.filter(
            (payment) => getStatus(payment) === "successful"
        );
        const pending = payments.filter(
            (payment) => getStatus(payment) === "pending"
        );
        const failed = payments.filter(
            (payment) => getStatus(payment) === "failed"
        );

        const successfulAmount = successful.reduce(
            (sum, payment) => sum + (Number(payment?.amount) || 0),
            0
        );

        return {
            total: payments.length,
            successful: successful.length,
            pending: pending.length,
            failed: failed.length,
            successfulAmount,
        };
    }, [payments]);

    return (
        <main className="payments-page">
            <header className="payments-header">
                <div>
                    <h1 className="payments-title">Manage Payments</h1>
                    <p className="payments-subtitle">
                        Review transactions, registration details, and payment statuses.
                    </p>
                </div>

                <button
                    type="button"
                    className="button primary payments-refresh"
                    onClick={loadPayments}
                    disabled={loading}
                >
                    {loading ? "Refreshing..." : "↻ Refresh Payments"}
                </button>
            </header>

            <section className="payments-stats" aria-label="Payment statistics">
                <article className="payment-stat-card total">
                    <span className="payment-stat-label">Total Payments</span>
                    <strong className="payment-stat-value">{stats.total}</strong>
                </article>

                <article className="payment-stat-card successful">
                    <span className="payment-stat-label">Successful</span>
                    <strong className="payment-stat-value">{stats.successful}</strong>
                </article>

                <article className="payment-stat-card pending">
                    <span className="payment-stat-label">Pending</span>
                    <strong className="payment-stat-value">{stats.pending}</strong>
                </article>

                <article className="payment-stat-card failed">
                    <span className="payment-stat-label">Failed</span>
                    <strong className="payment-stat-value">{stats.failed}</strong>
                </article>
            </section>

            <section className="payments-panel">
                <div className="payments-toolbar">
                    <h2 className="payments-toolbar-title">Payment Transactions</h2>

                    <div className="payments-filters">
                        <div className="payments-search">
                            <input
                                type="search"
                                aria-label="Search payments"
                                placeholder="Search student, event, transaction..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>

                        <select
                            className="payments-status-filter"
                            aria-label="Filter by payment status"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="all">All statuses</option>
                            <option value="successful">Successful</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="alert error payments-error" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="loading-message">Loading payments...</div>
                ) : filteredPayments.length === 0 ? (
                    <div className="payments-empty">
                        <div className="payments-empty-icon" aria-hidden="true">
                            ₹
                        </div>
                        <h3>{payments.length === 0 ? "No payments found" : "No matching payments"}</h3>
                        <p>
                            {payments.length === 0
                                ? "Payments will appear here when transactions are created."
                                : "Try changing your search or selecting a different status."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="payments-table-wrap">
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Transaction</th>
                                        <th>Registration</th>
                                        <th>Student</th>
                                        <th>Event</th>
                                        <th>Amount</th>
                                        <th>Method / Gateway</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredPayments.map((payment) => {
                                        const student = getStudent(payment);
                                        const event = getEvent(payment);
                                        const status = getStatus(payment);

                                        return (
                                            <tr key={payment?._id || getTransactionId(payment)}>
                                                <td>
                                                    <span className="payment-primary-text">
                                                        {getTransactionId(payment)}
                                                    </span>
                                                    {payment?.razorpayOrderId && (
                                                        <span className="payment-secondary-text">
                                                            Order: {payment.razorpayOrderId}
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="payment-primary-text">
                                                        {getRegistrationId(payment)}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="payment-primary-text">
                                                        {student?.fullName || student?.name || "Unknown student"}
                                                    </span>
                                                    <span className="payment-secondary-text">
                                                        {student?.email || "No email"}
                                                    </span>
                                                    {student?.collegePid && (
                                                        <span className="payment-secondary-text">
                                                            PID: {student.collegePid}
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="payment-primary-text">
                                                        {event?.name || "Event unavailable"}
                                                    </span>
                                                    {event?.category && (
                                                        <span className="payment-secondary-text">
                                                            {event.category}
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="payment-amount">
                                                        {formatCurrency(payment?.amount, payment?.currency)}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="payment-primary-text">
                                                        {payment?.paymentMethod || "—"}
                                                    </span>
                                                    <span className="payment-secondary-text">
                                                        Gateway: {payment?.gateway || "—"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className={`payment-status ${status}`}>
                                                        {displayStatus(payment)}
                                                    </span>
                                                </td>

                                                <td>{formatDate(payment?.createdAt || payment?.updatedAt)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <footer className="payments-table-footer">
                            <span>
                                Showing {filteredPayments.length} of {payments.length} payments
                            </span>
                            <span>
                                Successful amount:{" "}
                                <strong>{formatCurrency(stats.successfulAmount)}</strong>
                            </span>
                        </footer>
                    </>
                )}
            </section>
        </main>
    );
}
