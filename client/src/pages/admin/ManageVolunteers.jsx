
import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import AdminStatsBoard from "../../components/AdminStatsBoard";
import AdminPageHero from "../../components/AdminPageHero";

const emptyForm = {
    fullName: "",
    departmentName: "",
    mobileNumber: "",
    studentId: "",
    email: "",
    eventIds: []
};

export default function ManageVolunteers() {
    const [volunteers, setVolunteers] = useState(null);
    const [events, setEvents] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [credentials, setCredentials] = useState(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("all");

    const load = async () => {
        const [v, e] = await Promise.all([
            api.get("/admin/volunteers"),
            api.get("/events")
        ]);

        const volunteerList = Array.isArray(v.data.volunteers)
            ? v.data.volunteers.filter(
                (item) => item && typeof item === "object"
            )
            : [];

        setVolunteers(volunteerList);

        const eventList = e.data.events || e.data || [];

        setEvents(
            Array.isArray(eventList)
                ? eventList.filter(
                    (item) => item && typeof item === "object"
                )
                : []
        );
    };

    useEffect(() => {
        load().catch((err) =>
            setError(
                err.response?.data?.message ||
                "Unable to load volunteer data."
            )
        );
    }, []);

    const change = (e) => {
        setForm((current) => ({
            ...current,
            [e.target.name]: e.target.value
        }));
    };

    const toggleEvent = (eventId) => {
        setForm((current) => ({
            ...current,
            eventIds: current.eventIds.includes(eventId)
                ? current.eventIds.filter((id) => id !== eventId)
                : [...current.eventIds, eventId]
        }));
    };

    const create = async (e) => {
        e.preventDefault();

        setBusy(true);
        setError("");
        setMessage("");
        setCredentials(null);

        try {
            const { data } = await api.post(
                "/admin/volunteers",
                form
            );

            setMessage(data.message);

            setCredentials(
                data.credentialsSent
                    ? {
                        loginId: data.credentials?.loginId,
                        email: form.email
                    }
                    : null
            );

            setForm(emptyForm);
            setShowForm(false);

            await load();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create volunteer."
            );
        } finally {
            setBusy(false);
        }
    };

    // Get event ID whether assignedEvents contains objects or IDs
    const getEventId = (event) => {
        if (!event) return "";
        return String(event._id || event);
    };

    // Combine available events and already assigned events
    const eventOptionsMap = new Map();

    events.forEach((event) => {
        if (event?._id) {
            eventOptionsMap.set(String(event._id), event);
        }
    });

    (volunteers || []).forEach((volunteer) => {
        (volunteer.assignedEvents || []).forEach((event) => {
            if (event && typeof event === "object" && event._id) {
                eventOptionsMap.set(String(event._id), event);
            }
        });
    });

    const eventOptions = Array.from(eventOptionsMap.values());

    // Search and event filtering
    const filteredVolunteers = (volunteers || []).filter((volunteer) => {
        const search = searchTerm.trim().toLowerCase();

        const searchableFields = [
            volunteer.fullName,
            volunteer.departmentName,
            volunteer.mobileNumber,
            volunteer.collegePid,
            volunteer.studentId,
            volunteer.loginId,
            volunteer.email
        ];

        const matchesSearch =
            !search ||
            searchableFields.some((value) =>
                String(value || "").toLowerCase().includes(search)
            );

        const assignedEvents = Array.isArray(volunteer.assignedEvents)
            ? volunteer.assignedEvents
            : [];

        const matchesEvent =
            selectedEvent === "all" ||
            assignedEvents.some(
                (event) => getEventId(event) === selectedEvent
            );

        return matchesSearch && matchesEvent;
    });


    if (!volunteers) return <Loading />;

    return (
        <main className="container admin-volunteers-page">

            <AdminPageHero
                eyebrow="PEOPLE & EVENT SUPPORT"
                title="Manage Volunteers"
                description="Create volunteer accounts, assign events, and email an allocation notice for each event."
                actions={
                    <button
                        className="button primary"
                        onClick={() => {
                            setShowForm((value) => !value);
                            setError("");
                            setMessage("");
                            setCredentials(null);
                        }}
                    >
                        {showForm ? "Cancel" : "+ Add Volunteer"}
                    </button>
                }
            />

            <AdminStatsBoard
                items={[
                    {
                        label: "Volunteers",
                        value: volunteers.length,
                        note: "Active accounts",
                        icon: "?"
                    },
                    {
                        label: "Assigned events",
                        value: events.length,
                        note: "Available for assignment",
                        icon: "?"
                    },
                    {
                        label: "Event allocations",
                        value: volunteers.reduce(
                            (sum, volunteer) =>
                                sum +
                                (volunteer.assignedEvents || []).length,
                            0
                        ),
                        note: "Across all volunteers",
                        icon: "?"
                    }
                ]}
            />

            {error && <div className="alert error">{error}</div>}
            {message && <div className="alert success">{message}</div>}

            {credentials && (
                <section className="card volunteer-credentials">
                    <h2>Credentials emailed successfully</h2>

                    <p>
                        The volunteer's Login ID and temporary password
                        have been sent to{" "}
                        <strong>{credentials.email}</strong>.
                    </p>

                    <p>
                        <strong>Login ID:</strong> {credentials.loginId}
                    </p>

                    <p>
                        The temporary password is intentionally not
                        displayed here. Ask the volunteer to check
                        their inbox and spam folder.
                    </p>
                </section>
            )}

            {showForm && (
                <form
                    className="card admin-form-card"
                    onSubmit={create}
                >
                    <h2>New Volunteer</h2>

                    <div className="admin-form-grid">

                        <label>
                            Volunteer Name
                            <input
                                name="fullName"
                                value={form.fullName}
                                onChange={change}
                                required
                            />
                        </label>

                        <label>
                            Department Name
                            <input
                                name="departmentName"
                                value={form.departmentName}
                                onChange={change}
                                required
                                placeholder="e.g. Computer Science"
                            />
                        </label>

                        <label>
                            Mobile Number
                            <input
                                name="mobileNumber"
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={form.mobileNumber}
                                onChange={change}
                                required
                            />
                        </label>

                        <label>
                            Student ID
                            <input
                                name="studentId"
                                value={form.studentId}
                                onChange={change}
                                required
                            />
                        </label>

                        <label>
                            Email Address
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={change}
                                required
                                placeholder="volunteer@example.com"
                            />
                        </label>

                        <fieldset
                            className="volunteer-event-picker"
                            style={{
                                gridColumn: "1 / -1",
                                border: "1px solid var(--border)",
                                borderRadius: "10px",
                                padding: "14px"
                            }}
                        >
                            <legend>
                                Assign Events (select one or multiple)
                            </legend>

                            {events.map((event) => (
                                <label
                                    key={event._id}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "10px",
                                        margin: "10px 0"
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.eventIds.includes(event._id)}
                                        onChange={() =>
                                            toggleEvent(event._id)
                                        }
                                    />

                                    <span>
                                        <strong>{event.name}</strong>
                                        <br />
                                        <small>
                                            {event.category || "Event"} ·{" "}
                                            {event.date
                                                ? new Date(event.date).toLocaleString()
                                                : "Date TBA"}{" "}
                                            · {event.location || "Location TBA"}
                                        </small>
                                    </span>
                                </label>
                            ))}

                            <small>
                                {form.eventIds.length} event(s) selected.
                                A separate allocation email will be sent
                                for each selected event.
                            </small>
                        </fieldset>
                    </div>

                    <button
                        className="button primary"
                        type="submit"
                        disabled={
                            busy ||
                            !events.length ||
                            !form.eventIds.length
                        }
                    >
                        {busy
                            ? "Creating…"
                            : "Create Volunteer & Email Login Credentials"}
                    </button>

                    {!events.length && (
                        <p className="hint">
                            Create an event before adding a volunteer.
                        </p>
                    )}
                </form>
            )}

            {/* Volunteer list with search and event filter */}
            <section className="card table-card">

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "15px",
                        marginBottom: "20px"
                    }}
                >
                    <div>
                        <h2 style={{ marginBottom: "5px" }}>
                            Volunteer Accounts
                        </h2>

                        <p style={{ margin: 0 }}>
                            Showing {filteredVolunteers.length} of{" "}
                            {volunteers.length} volunteers
                        </p>
                    </div>

                    
                </div>

                {/* Search and event dropdown */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "15px",
                        marginBottom: "20px"
                    }}
                >
                    <input
                        type="search"
                        placeholder="Search by name, mobile, Student ID, Login ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid var(--border)",
                            borderRadius: "8px"
                        }}
                    />

                    <select
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid var(--border)",
                            borderRadius: "8px"
                        }}
                    >
                        <option value="all">All Events</option>

                        {eventOptions.map((event) => (
                            <option
                                key={event._id}
                                value={String(event._id)}
                            >
                                {event.name}
                            </option>
                        ))}
                    </select>
                </div>

                {!volunteers.length ? (
                    <p>No volunteers have been added yet.</p>
                ) : filteredVolunteers.length === 0 ? (
                    <p>
                        No volunteers found for the selected search or event.
                    </p>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Mobile</th>
                                    <th>Student ID</th>
                                    <th>Login ID</th>
                                    <th>Assigned Events</th>
                                    <th>Created</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredVolunteers.map((v) => (
                                    <tr key={v._id}>
                                        <td>{v.fullName}</td>
                                        <td>{v.departmentName || "—"}</td>
                                        <td>{v.mobileNumber}</td>
                                        <td>{v.collegePid || v.studentId || "—"}</td>
                                        <td>{v.loginId || "—"}</td>

                                        <td>
                                            <div>
                                                {(v.assignedEvents || []).map(
                                                    (event) => (
                                                        <div key={getEventId(event)}>
                                                            {event?.name ||
                                                                "Assigned event"}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            {v.createdAt
                                                ? new Date(v.createdAt).toLocaleDateString()
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
