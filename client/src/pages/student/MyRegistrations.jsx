import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router-dom";

import api
    from "../../services/api";

import Loading
    from "../../components/Loading";

export default function MyRegistrations() {

    const [
        registrations,
        setRegistrations
    ] = useState(null);

    useEffect(() => {

        api.get(
            "/registrations/my"
        )
            .then(
                ({ data }) =>
                    setRegistrations(
                        data.registrations
                    )
            );

    }, []);

    if (!registrations) {
        return <Loading />;
    }

    const upcomingCount = registrations.filter((registration) => registration.event && new Date(registration.event.date) >= new Date()).length;
    const confirmedCount = registrations.filter((registration) => registration.registrationStatus === "Confirmed").length;

    return (
        <main className="container student-registrations-page">
            <header className="student-listing-hero">
                <div><p className="eyebrow">YOUR CAMPUS PLANS</p><h1>My registrations</h1><p>Every event you signed up for, together in one place.</p></div>
                <div className="student-listing-orbit" aria-hidden="true">✦</div>
                <div className="student-listing-stats"><div><strong>{registrations.length}</strong><span>All bookings</span></div><div><strong>{upcomingCount}</strong><span>Coming up</span></div><div><strong>{confirmedCount}</strong><span>Confirmed</span></div></div>
            </header>

            <section className="student-registrations-table-card">
                <div className="student-registrations-table-heading"><div><p className="eyebrow">YOUR EVENT HISTORY</p><h2>Registrations</h2></div><span>{registrations.length} {registrations.length === 1 ? "event" : "events"}</span></div>
                <div className="table-wrap">

                <table>

                    <thead>

                        <tr>
                            <th>
                                Registration ID
                            </th>

                            <th>
                                Event
                            </th>

                            <th>
                                Category
                            </th>

                            <th>
                                Date
                            </th>

                            <th>
                                Participation
                            </th>

                            <th>
                                Team
                            </th>

                            <th>
                                Payment
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Details
                            </th>
                        </tr>

                    </thead>

                    <tbody>

                        {registrations.map(
                            (registration) => (

                                <tr
                                    key={
                                        registration._id
                                    }
                                >

                                    <td>
                                        {
                                            registration
                                                .registrationId
                                        }
                                    </td>

                                    <td>
                                        {
                                            registration
                                                .event
                                                ?.name
                                        }
                                    </td>

                                    <td>
                                        {
                                            registration
                                                .event
                                                ?.category
                                        }
                                    </td>

                                    <td>
                                        {
                                            registration.event
                                                ? new Date(
                                                    registration
                                                        .event
                                                        .date
                                                ).toLocaleDateString()
                                                : "-"
                                        }
                                    </td>

                                    <td>
                                        {
                                            registration
                                                .participation
                                                .type
                                        }
                                    </td>

                                    <td>
                                        {
                                            registration
                                                .participation
                                                .teamName ||
                                            "-"
                                        }
                                    </td>

                                    <td>
                                        {
                                            registration
                                                .payment
                                                ?.status ||
                                            "Pending"
                                        }
                                    </td>

                                    <td>
                                        {
                                            registration
                                                .registrationStatus
                                        }
                                    </td>

                                    <td>
                                        <Link
                                            to={`/student/registrations/${registration._id}`}
                                        >
                                            View
                                        </Link>
                                    </td>

                                </tr>

                            )
                        )}

                        {!registrations.length && <tr><td className="student-registrations-empty" colSpan="9"><span>✦</span><strong>No registrations yet</strong><p>Find an event that sounds like you and save your spot.</p><Link className="button primary" to="/student/events">Explore events ↗</Link></td></tr>}

                    </tbody>

                </table>

                </div>
            </section>

        </main>
    );
}
