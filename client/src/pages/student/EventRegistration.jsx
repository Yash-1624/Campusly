import {
    useEffect,
    useState
} from "react";

import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

import api
    from "../../services/api";

import Loading
    from "../../components/Loading";


export default function EventRegistration() {

    const { id } =
        useParams();

    const navigate =
        useNavigate();

    const [now, setNow] = useState(0);

    useEffect(() => {
        const updateNow = () => setNow(Date.now());
        updateNow();
        const timer = window.setInterval(updateNow, 1_000);
        return () => window.clearInterval(timer);
    }, []);


    const [event, setEvent] =
        useState(null);

    const [profile, setProfile] =
        useState(null);


    const [
        participationType,
        setParticipationType
    ] = useState("");


    const [
        teamName,
        setTeamName
    ] = useState("");


    const [
        numberOfMembers,
        setNumberOfMembers
    ] = useState("");


    const [
        informationCorrect,
        setInformationCorrect
    ] = useState(false);


    const [
        agreedToRules,
        setAgreedToRules
    ] = useState(false);


    const [
        error,
        setError
    ] = useState("");


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    // =====================================================
    // LOAD EVENT AND PROFILE
    // =====================================================
    useEffect(() => {

        Promise.all([
            api.get(`/events/${id}`),
            api.get("/profile")
        ])

            .then(
                ([
                    eventRes,
                    profileRes
                ]) => {

                    const e =
                        eventRes.data.event;

                    setEvent(e);

                    setProfile(
                        profileRes.data.profile
                    );


                    // Automatically select
                    // participation type
                    if (
                        e.participationType.individual &&
                        !e.participationType.team
                    ) {

                        setParticipationType(
                            "Individual"
                        );
                    }


                    if (
                        !e.participationType.individual &&
                        e.participationType.team
                    ) {

                        setParticipationType(
                            "Team"
                        );
                    }
                }
            )

            .catch(err => {

                setError(
                    err.response?.data?.message ||
                    "Could not load registration data."
                );

            });

    }, [id]);


    // =====================================================
    // SUBMIT REGISTRATION
    // =====================================================
    const submit = async (e) => {

        e.preventDefault();
        const now = Date.now();
        if (!["Published", "Registration Open"].includes(event?.status) || new Date(event?.registrationStartDate).getTime() > now || new Date(event?.registrationEndDate).getTime() <= now || new Date(event?.date).getTime() < now) { setError("Registration is not currently open for this event."); return; }

        setError("");


        // -------------------------------------------------
        // COLLEGE PID CHECK
        // -------------------------------------------------
        if (!profile?.collegePid) {

            setError(
                "Please add your College PID in your profile before registering."
            );

            return;
        }


        // -------------------------------------------------
        // PARTICIPATION CHECK
        // -------------------------------------------------
        if (!participationType) {

            setError(
                "Please select a participation type."
            );

            return;
        }


        // -------------------------------------------------
        // CONFIRMATION CHECK
        // -------------------------------------------------
        if (
            !informationCorrect ||
            !agreedToRules
        ) {

            setError(
                "Please accept both confirmations."
            );

            return;
        }


        setSubmitting(true);


        try {

            const { data } =
                await api.post(
                    "/registrations",
                    {

                        eventId:
                            id,

                        participationType:
                            participationType,

                        teamName:
                            teamName,

                        numberOfMembers:
                            participationType === "Team"
                                ? Number(numberOfMembers)
                                : 1,

                        informationCorrect:
                            informationCorrect,

                        agreedToRules:
                            agreedToRules
                    }
                );


            // =================================================
            // GO TO PAYMENT
            // =================================================
            navigate(
                `/student/payment/${data.registration._id}`
            );


        } catch (error) {
            console.error("Registration Error:", error);

            console.log(
                "Server Response:",
                JSON.stringify(
                    error.response?.data,
                    null,
                    2
                )
            );

            setError(
                error.response?.data?.message ||
                "Registration failed."
            );
        }
    };


    // =====================================================
    // LOADING
    // =====================================================
    if (
        !event ||
        !profile
    ) {
        return <Loading />;
    }

    const registrationOpen = ["Published", "Registration Open"].includes(event.status)
        && new Date(event.registrationStartDate).getTime() <= now
        && new Date(event.registrationEndDate).getTime() > now
        && new Date(event.date).getTime() >= now;

    if (!registrationOpen) {
        return (
            <main className="container narrow">
                <section className="form-card">
                    <h1>Registration is closed</h1>
                    <p>The registration window for {event.name} is not open now.</p>
                    <Link className="button secondary" to={`/student/events/${id}`}>Back to event details</Link>
                </section>
            </main>
        );
    }


    return (

        <main className="container narrow">

            <form
                className="form-card"
                onSubmit={submit}
            >

                <h1>
                    Event Registration
                </h1>


                {!["Published", "Registration Open"].includes(event.status) || new Date(event.registrationStartDate).getTime() > now || new Date(event.registrationEndDate).getTime() <= now || new Date(event.date).getTime() < now ? <div className="alert error">Registration is not currently open for this event.</div> : null}
                {error && (
                    <div className="alert error">
                        {error}
                    </div>
                )}


                {/* =================================================
            STUDENT INFORMATION
        ================================================= */}
                <h2>
                    Student Information
                </h2>


                <div className="readonly-grid">

                    <div>
                        <small>
                            Full Name
                        </small>

                        <strong>
                            {profile.fullName}
                        </strong>
                    </div>


                    {/* COLLEGE PID ADDED */}
                    <div>
                        <small>
                            College PID
                        </small>

                        <strong>
                            {profile.collegePid ||
                                "Not Added"}
                        </strong>
                    </div>


                    <div>
                        <small>
                            College/University
                        </small>

                        <strong>
                            {profile.collegeName}
                        </strong>
                    </div>


                    <div>
                        <small>
                            Year/Semester
                        </small>

                        <strong>
                            {profile.yearSemester}
                        </strong>
                    </div>

                </div>


                {/* =================================================
            CONTACT INFORMATION
        ================================================= */}
                <h2>
                    Contact Information
                </h2>


                <div className="readonly-grid">

                    <div>
                        <small>
                            Mobile Number
                        </small>

                        <strong>
                            {profile.mobileNumber}
                        </strong>
                    </div>


                    <div>
                        <small>
                            Email
                        </small>

                        <strong>
                            {profile.email}
                        </strong>
                    </div>

                </div>


                {/* =================================================
            EVENT INFORMATION
        ================================================= */}
                <h2>
                    Event Information
                </h2>


                <p>
                    <strong>
                        {event.name}
                    </strong>

                    {" — "}

                    {event.category}
                </p>


                {/* =================================================
            PARTICIPATION
        ================================================= */}
                <label>
                    Participation Type
                </label>


                <div className="radio-row">

                    {event.participationType.individual && (

                        <label>

                            <input
                                type="radio"
                                name="participation"

                                checked={
                                    participationType ===
                                    "Individual"
                                }

                                onChange={() =>
                                    setParticipationType(
                                        "Individual"
                                    )
                                }
                            />

                            Individual

                        </label>
                    )}


                    {event.participationType.team && (

                        <label>

                            <input
                                type="radio"
                                name="participation"

                                checked={
                                    participationType ===
                                    "Team"
                                }

                                onChange={() =>
                                    setParticipationType(
                                        "Team"
                                    )
                                }
                            />

                            Team

                        </label>
                    )}

                </div>


                {/* =================================================
            TEAM INFORMATION
        ================================================= */}
                {participationType === "Team" && (

                    <>

                        <label>
                            Team Name

                            <input
                                required
                                value={teamName}

                                onChange={e =>
                                    setTeamName(
                                        e.target.value
                                    )
                                }
                            />

                        </label>


                        <label>
                            Number of Team Members

                            <select
                                required
                                value={numberOfMembers}

                                onChange={e =>
                                    setNumberOfMembers(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Select
                                </option>


                                {Array.from(
                                    {
                                        length:
                                            event.teamSettings.maxMembers -
                                            event.teamSettings.minMembers +
                                            1
                                    },

                                    (_, i) =>
                                        event.teamSettings.minMembers +
                                        i

                                ).map(n => (

                                    <option
                                        key={n}
                                        value={n}
                                    >
                                        {n}
                                    </option>

                                ))}

                            </select>

                        </label>


                        <p className="hint">
                            Allowed:{" "}
                            {event.teamSettings.minMembers}
                            {" to "}
                            {event.teamSettings.maxMembers}
                            {" members."}
                        </p>

                    </>

                )}


                {/* =================================================
            CONFIRMATION
        ================================================= */}
                <label className="check">

                    <input
                        type="checkbox"

                        checked={
                            informationCorrect
                        }

                        onChange={e =>
                            setInformationCorrect(
                                e.target.checked
                            )
                        }
                    />

                    I confirm that the
                    information provided is correct.

                </label>


                <label className="check">

                    <input
                        type="checkbox"

                        checked={
                            agreedToRules
                        }

                        onChange={e =>
                            setAgreedToRules(
                                e.target.checked
                            )
                        }
                    />

                    I agree to follow the
                    event rules and guidelines.

                </label>


                {/* =================================================
            CONTINUE TO PAYMENT
        ================================================= */}
                <button
                    type="submit"
                    className="button primary"

                    disabled={
                        submitting ||
                        !participationType ||
                        !["Published", "Registration Open"].includes(event.status) ||
                        new Date(event.registrationStartDate).getTime() > now ||
                        new Date(event.registrationEndDate).getTime() <= now ||
                        new Date(event.date).getTime() < now
                    }
                >

                    {submitting
                        ? "Creating Registration..."
                        : `Continue to Payment — ₹${event.fee}`}

                </button>

            </form>

        </main>
    );
}
