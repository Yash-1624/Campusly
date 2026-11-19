import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/Loading";

const emptyForm = {
    fullName: "",
    collegePid: "",
    email: "",
    mobileNumber: "",
    collegeName: "",
    yearSemester: "",
    password: "",
};

export default function ManageStudents() {
    const [students, setStudents] = useState(null);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadStudents = async () => {
        try {
            const { data } = await api.get("/admin/students");
            setStudents(data.students || []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to load students."
            );
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadStudents();
    }, []);

    const filtered = useMemo(() => {
        if (!students) return [];

        const term = search.toLowerCase().trim();
        if (!term) return students;

        return students.filter((student) =>
            [
                student.fullName,
                student.collegePid,
                student.email,
                student.collegeName,
                student.yearSemester,
                student.mobileNumber,
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(term)
            )
        );
    }, [students, search]);

    const change = (e) => {
        const { name, value } = e.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const createStudent = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setSaving(true);

        try {
            const { data } = await api.post("/admin/students", form);
            setMessage(data.message || "Student created successfully.");
            setForm(emptyForm);
            setShowForm(false);
            await loadStudents();
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to create student."
            );
        } finally {
            setSaving(false);
        }
    };

    if (!students) {
        return <Loading />;
    }

    const fields = [
        ["fullName", "Full name", "text"],
        ["collegePid", "College PID", "text"],
        ["email", "Email address", "email"],
        ["mobileNumber", "Mobile number", "tel"],
        ["collegeName", "College / University", "text"],
        ["yearSemester", "Year / Semester", "text"],
        ["password", "Temporary password (min. 8 characters)", "password"],
    ];

    return (
        <main className="container admin-students-page">
            {/* Header */}
            <div className="page-heading">
                <div>
                    <p className="login-eyebrow">ADMINISTRATION</p>
                    <h1>Manage Students</h1>
                    <p className="page-subtitle">
                        Create student accounts and maintain student profiles.
                    </p>
                </div>

                <button
                    className="button primary"
                    onClick={() => {
                        setShowForm((v) => !v);
                        setError("");
                        setMessage("");
                    }}
                >
                    ＋ Add New Student
                </button>
            </div>

            {/* Alerts */}
            {message && <div className="alert success">{message}</div>}
            {error && <div className="alert error">{error}</div>}

            {/* Create Student Form */}
            {showForm && (
                <section className="card admin-form-card">
                    <div className="page-heading">
                        <div>
                            <h2>Create Student Account</h2>
                            <p className="page-subtitle">
                                A temporary password is set by the admin. The password is never
                                displayed again.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="button outline small"
                            onClick={() => setShowForm(false)}
                        >
                            Close
                        </button>
                    </div>

                    <form onSubmit={createStudent}>
                        <div className="admin-form-grid">
                            {fields.map(([name, label, type]) => (
                                <label key={name}>
                                    {label}
                                    <input
                                        name={name}
                                        type={type}
                                        value={form[name]}
                                        onChange={change}
                                        minLength={name === "password" ? 8 : undefined}
                                        required
                                        autoComplete="off"
                                        disabled={saving}
                                    />
                                </label>
                            ))}
                        </div>

                        <p className="hint">
                            The account is created as a student and starts with email
                            verification marked as incomplete.
                        </p>

                        <button className="button primary" disabled={saving}>
                            {saving ? "Creating…" : "Create Student"}
                        </button>
                    </form>
                </section>
            )}

            {/* Student Directory */}
            <section className="card student-list-card">
                <div className="students-toolbar">
                    <div>
                        <h2>Student Directory</h2>
                        <p className="page-subtitle">
                            {filtered.length} student{filtered.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    <input
                        className="search"
                        type="search"
                        aria-label="Search students"
                        placeholder="Search name, PID, email, college…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>College PID</th>
                                <th>Contact</th>
                                <th>College</th>
                                <th>Year/Semester</th>
                                <th>Email status</th>
                                <th>Created</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.map((student) => (
                                <tr key={student._id}>
                                    <td>
                                        <strong>{student.fullName}</strong>
                                    </td>
                                    <td>{student.collegePid}</td>
                                    <td>
                                        {student.email}
                                        <br />
                                        <small>{student.mobileNumber}</small>
                                    </td>
                                    <td>{student.collegeName}</td>
                                    <td>{student.yearSemester}</td>
                                    <td>
                                        <span
                                            className={
                                                student.isEmailVerified
                                                    ? "status-pill success"
                                                    : "status-pill warning"
                                            }
                                        >
                                            {student.isEmailVerified ? "Verified" : "Pending"}
                                        </span>
                                    </td>
                                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <Link
                                            className="button outline small"
                                            to={`/control-center/students/${student._id}`}
                                        >
                                            Manage
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <p className="empty-state">No students match your search.</p>
                    )}
                </div>
            </section>
        </main>
    );
}
