import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../services/api";
import Loading from "../../components/Loading";
import QRScanner from "../../components/QRScanner";
import AdminPageHero from "../../components/AdminPageHero";

export default function RegistrationDetails() {
    const { id } = useParams();

    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState("");
    const [participationType, setParticipationType] = useState("Individual");
    const [teamName, setTeamName] = useState("");
    const [memberCount, setMemberCount] = useState(2);

    useEffect(() => {
        const loadRegistration = async () => {
            try {
                const response = await api.get(
                    `/registrations/${id}`
                );

                setData(response.data.registration);
                setParticipationType(response.data.registration.participation?.type || "Individual");
                setTeamName(response.data.registration.participation?.teamName || "");
                setMemberCount(response.data.registration.participation?.numberOfMembers || 2);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load registration."
                );
            }
        };

        if (id) {
            loadRegistration();
        }
    }, [id]);

    const saveParticipation = async (event) => { event.preventDefault(); setEditError(""); try { const { data: updated } = await api.patch(`/registrations/${id}`, { participationType, teamName, numberOfMembers: memberCount }); setData(updated.registration); setEditing(false); } catch (err) { setEditError(err.response?.data?.message || "Could not update registration."); } };

    if (!data && !error) {
        return <Loading />;
    }

    if (error) {
        return (
            <main className="container">
                <div className="alert error">
                    {error}
                </div>
            </main>
        );
    }

    return (
        <main className="container admin-registration-page">

            <AdminPageHero eyebrow="EVENT PARTICIPANTS" title="Registration Details" description={`Review the student, event, and payment information${data.event?.name ? ` for ${data.event.name}` : ""}.`} actions={<Link className="button primary" to="/control-center/registrations">All Registrations</Link>} />

            <div className="admin-registration-layout">

                {/* ==========================================
            LEFT - REGISTRATION DETAILS
        ========================================== */}
                <div className="card registration-details-card">

                    {/* Student Information */}
                    <div className="detail-section">

                        <h2>
                            Student Information
                        </h2>

                        <div className="readonly-grid">

                            <div>
                                <small>
                                    Full Name
                                </small>

                                <strong>
                                    {data.studentInformation.fullName}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    College PID
                                </small>

                                <strong>
                                    {data.studentInformation.collegePid ||
                                        "-"}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    College / University
                                </small>

                                <strong>
                                    {data.studentInformation.collegeName}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Year / Semester
                                </small>

                                <strong>
                                    {data.studentInformation.yearSemester}
                                </strong>
                            </div>

                        </div>
                    </div>

                    {/* Contact */}
                    <div className="detail-section">

                        <h2>
                            Contact Information
                        </h2>

                        <div className="readonly-grid">

                            <div>
                                <small>
                                    Email
                                </small>

                                <strong>
                                    {data.contactInformation.email}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Mobile
                                </small>

                                <strong>
                                    {data.contactInformation.mobileNumber}
                                </strong>
                            </div>

                        </div>
                    </div>

                    {/* Event */}
                    <div className="detail-section">

                        <h2>
                            Event Information
                        </h2>

                        <div className="readonly-grid">

                            <div>
                                <small>
                                    Event
                                </small>

                                <strong>
                                    {data.event.name}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Category
                                </small>

                                <strong>
                                    {data.event.category}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Date
                                </small>

                                <strong>
                                    {new Date(
                                        data.event.date
                                    ).toLocaleString()}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Location
                                </small>

                                <strong>
                                    {data.event.location}
                                </strong>
                            </div>

                        </div>
                    </div>

                    {/* Participation */}
                    <div className="detail-section">
                        {! ["Cancelled", "Completed"].includes(data.registrationStatus) && <button type="button" className="button secondary" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel edit" : "Edit registration"}</button>}
                        {editing && <form className="registration-edit-form" onSubmit={saveParticipation}><label>Participation type<select value={participationType} onChange={(event) => setParticipationType(event.target.value)}><option>Individual</option>{data.event?.participationType?.team && <option>Team</option>}</select></label>{participationType === "Team" && <><label>Team name<input required value={teamName} onChange={(event) => setTeamName(event.target.value)} /></label><label>Team members<input type="number" min={data.event?.teamSettings?.minMembers || 2} max={data.event?.teamSettings?.maxMembers || 20} value={memberCount} onChange={(event) => setMemberCount(event.target.value)} /></label></>}<button className="button primary" type="submit">Save changes</button>{editError && <div className="alert error">{editError}</div>}</form>}

                        <h2>
                            Participation
                        </h2>

                        <div className="readonly-grid">

                            <div>
                                <small>
                                    Type
                                </small>

                                <strong>
                                    {data.participation.type}
                                </strong>
                            </div>

                            {data.participation.type === "Team" && (
                                <>
                                    <div>
                                        <small>
                                            Team Name
                                        </small>

                                        <strong>
                                            {data.participation.teamName ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>
                                            Team Members
                                        </small>

                                        <strong>
                                            {data.participation.numberOfMembers}
                                        </strong>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>

                    {/* Payment */}
                    <div className="detail-section">

                        <h2>
                            Payment
                        </h2>

                        <div className="readonly-grid">

                            <div>
                                <small>
                                    Payment Status
                                </small>

                                <strong className={`payment-state${String(data.payment.status || "").toLowerCase().includes("pending") ? " is-pending" : ""}`}>
                                    {data.payment.status}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Amount
                                </small>

                                <strong>
                                    ₹{data.event.fee}
                                </strong>
                            </div>

                        </div>
                    </div>

                    {/* Registration */}
                    <div className="detail-section">

                        <h2>
                            Registration
                        </h2>

                        <div className="readonly-grid">

                            <div>
                                <small>
                                    Registration ID
                                </small>

                                <strong>
                                    {data.registrationId}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Registration Status
                                </small>

                                <strong>
                                    {data.registrationStatus}
                                </strong>
                            </div>

                            <div>
                                <small>
                                    Registered At
                                </small>

                                <strong>
                                    {new Date(
                                        data.createdAt
                                    ).toLocaleString()}
                                </strong>
                            </div>

                        </div>
                    </div>

                    <Link
                        to="/control-center/registrations"
                        className="button secondary"
                    >
                        Back to Registrations
                    </Link>

                </div>


                {/* ==========================================
            RIGHT - QR SCANNER
        ========================================== */}
                <aside className="registration-scanner-side">

                    <QRScanner
                        eventId={data.event._id}
                    />

                </aside>

            </div>

        </main>
    );
}
