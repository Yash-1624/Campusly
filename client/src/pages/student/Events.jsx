import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import EventCard from "../../components/EventCard";
import Loading from "../../components/Loading";

export default function Events() {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All events");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/events")
            .then(({ data }) => { if (active) setEvents(Array.isArray(data.events) ? data.events : []); })
            .catch((err) => { if (active) setError(err.response?.data?.message || "Could not load events."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const categories = useMemo(() => ["All events", ...new Set(events.map((event) => event.category).filter(Boolean))], [events]);
    const filteredEvents = useMemo(() => {
        const query = search.trim().toLowerCase();
        return events.filter((event) => (category === "All events" || event.category === category) && (!query || [event.name, event.category, event.location, event.description].some((value) => value?.toLowerCase().includes(query))));
    }, [events, search, category]);

    if (loading) return <Loading text="Finding campus events…" />;

    return (
        <main className="container events-page student-events-page">
            <header className="events-page-heading"><div><p className="eyebrow">FIND YOUR NEXT THING</p><h1>Explore events.</h1><p>Make some plans. Meet your campus.</p></div><span className="events-count"><b>{filteredEvents.length}</b> {filteredEvents.length === 1 ? "event" : "events"}</span></header>
            <section className="events-toolbar" aria-label="Filter events">
                <label className="events-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events, places, and more" aria-label="Search campus events" /></label>
                <label className="events-category-select"><span className="visually-hidden">Filter by category</span><select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            </section>
            {error && <div className="alert error" role="alert">{error}</div>}
            {filteredEvents.length ? <div className="card-grid premium-event-grid">{filteredEvents.map((event) => <EventCard key={event._id} event={event} />)}</div> : <div className="events-empty"><span>✳</span><h2>{search || category !== "All events" ? "Nothing found this time." : "The calendar is taking a breath."}</h2><p>{search || category !== "All events" ? "Try another search or category." : "Check back soon for more events around campus."}</p>{(search || category !== "All events") && <button className="button secondary" onClick={() => { setSearch(""); setCategory("All events"); }}>Clear filters</button>}</div>}
        </main>
    );
}
