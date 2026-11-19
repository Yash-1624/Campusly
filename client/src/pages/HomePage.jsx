import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./HomePage.css";

function formatEventDate(date) {
    if (!date) return "Date to be announced";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Date to be announced";
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(parsedDate);
}

const eventMarks = ["\u2733", "\u2726", "\u25d2"];

function AnimatedCounter({ value }) {
    const [count, setCount] = useState(0);
    const counterRef = useRef(null);

    useEffect(() => {
        const element = counterRef.current;
        if (!element) return undefined;

        if (!("IntersectionObserver" in window)) {
            setCount(value);
            return undefined;
        }

        let animationFrame;
        let run = 0;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                run += 1;
                cancelAnimationFrame(animationFrame);
                setCount(0);
                return;
            }

            const currentRun = ++run;
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reducedMotion || value === 0) {
                setCount(value);
                return;
            }

            const startedAt = performance.now();
            const duration = 1000;
            const animate = (now) => {
                if (currentRun !== run) return;
                const progress = Math.min((now - startedAt) / duration, 1);
                const eased = 1 - (1 - progress) ** 4;
                setCount(Math.round(value * eased));
                if (progress < 1) animationFrame = requestAnimationFrame(animate);
            };
            animationFrame = requestAnimationFrame(animate);
        }, { threshold: 0.55 });

        observer.observe(element);
        return () => {
            run += 1;
            cancelAnimationFrame(animationFrame);
            observer.disconnect();
        };
    }, [value]);

    return <strong ref={counterRef} aria-label={`${value}`}>{count}</strong>;
}

export default function HomePage() {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/events")
            .then(({ data }) => { if (active) setEvents(Array.isArray(data.events) ? data.events : []); })
            .catch(() => { if (active) setError("Events are temporarily unavailable. Please check back soon."); });
        return () => { active = false; };
    }, []);

    const categories = useMemo(() => {
        const counts = new Map();
        events.forEach(({ category }) => {
            const name = category?.trim();
            if (name) counts.set(name, (counts.get(name) || 0) + 1);
        });
        return [...counts.entries()].slice(0, 4);
    }, [events]);

    const shownEvents = useMemo(() => {
        const query = search.trim().toLowerCase();
        return events.filter((event) => !query || [event.name, event.category, event.location, event.description].some((value) => value?.toLowerCase().includes(query))).slice(0, 3);
    }, [events, search]);

    return (
        <main className="home-page" onPointerMove={(event) => {
            if (event.pointerType !== "mouse") return;
            event.currentTarget.style.setProperty("--home-pointer-x", `${event.clientX}px`);
            event.currentTarget.style.setProperty("--home-pointer-y", `${event.clientY}px`);
            event.currentTarget.classList.add("is-pointing");
        }} onPointerLeave={(event) => event.currentTarget.classList.remove("is-pointing")}>
            <section className="home-hero">
                <div className="hero-noise" aria-hidden="true" />
                <div className="hero-side-art hero-side-art-left" aria-hidden="true"><span className="side-cap"><i /><b /></span><span className="side-cap-shadow" /></div>
                <div className="home-hero-inner">
                    <div className="hero-copy">
                        <div className="hero-kicker"><span className="kicker-dot" /> CAMPUS EVENTS, ALL IN ONE PLACE</div>
                        <h1>Where Campus Life<br /><span>Comes Alive.</span></h1>
                        <p>Discover events, find your community, and make more of every moment on campus.</p>
                        <form className="event-search" onSubmit={(event) => { event.preventDefault(); document.querySelector("#explore")?.scrollIntoView({ behavior: "smooth" }); }}>
                            <span className="search-icon" aria-hidden="true">⌕</span>
                            <input aria-label="Search events" placeholder="Search events, places, and more" value={search} onChange={(event) => setSearch(event.target.value)} />
                            <button type="submit">Explore <span aria-hidden="true">↗</span></button>
                        </form>
                        <div className="hero-footnote"><span className="avatar-stack" aria-hidden="true"><i>✦</i><i>◉</i><i>✳</i></span><span>A little something for every kind of curious.</span></div>
                    </div>
                    <div className="hero-art" aria-label="A 3D illustration of a campus event ticket and calendar" onPointerMove={(pointerEvent) => {
                        if (pointerEvent.pointerType !== "mouse") return;
                        const bounds = pointerEvent.currentTarget.getBoundingClientRect();
                        const x = (pointerEvent.clientX - bounds.left) / bounds.width;
                        const y = (pointerEvent.clientY - bounds.top) / bounds.height;
                        pointerEvent.currentTarget.style.setProperty("--art-tilt-x", `${(0.5 - y) * 9}deg`);
                        pointerEvent.currentTarget.style.setProperty("--art-tilt-y", `${(x - 0.5) * 12}deg`);
                        pointerEvent.currentTarget.style.setProperty("--art-light-x", `${x * 100}%`);
                        pointerEvent.currentTarget.style.setProperty("--art-light-y", `${y * 100}%`);
                        pointerEvent.currentTarget.classList.add("is-art-pointing");
                    }} onPointerLeave={(pointerEvent) => {
                        pointerEvent.currentTarget.style.setProperty("--art-tilt-x", "0deg");
                        pointerEvent.currentTarget.style.setProperty("--art-tilt-y", "0deg");
                        pointerEvent.currentTarget.classList.remove("is-art-pointing");
                    }}>
                        <div className="campus-orbit orbit-one" aria-hidden="true" />
                        <div className="campus-orbit orbit-two" aria-hidden="true" />
                        <span className="campus-spark spark-one" aria-hidden="true">✦</span>
                        <span className="campus-spark spark-two" aria-hidden="true">✧</span>
                        <div className="campus-calendar" aria-hidden="true">
                            <span className="calendar-rings"><i /><i /></span>
                            <span className="calendar-month">CAMPUS • 2026</span>
                            <strong>EVENT<br />DAY</strong>
                            <span className="calendar-date">LET'S MAKE IT COUNT</span>
                            <span className="calendar-glow" />
                        </div>
                        <div className="campus-ticket" aria-hidden="true">
                            <span className="ticket-topline"><i /> YOUR PASS</span>
                            <span className="ticket-icon">✦</span>
                            <strong>MAKE<br />SOME<br /><em>MEMORIES.</em></strong>
                            <span className="ticket-divider"><i /><b /><i /></span>
                            <span className="ticket-bottom"><span>COLLEGE<br />EVENTS</span><b>✳</b></span>
                        </div>
                        <div className="campus-floating-note" aria-hidden="true"><span>✦</span><div><b>Find your people</b><small>Good things happen here</small></div></div>
                        <div className="campus-stage" aria-hidden="true" />
                    </div>
                </div>
                <div className="hero-bottomline"><span>CURATED FOR YOUR CAMPUS</span><span>SCROLL TO DISCOVER <b>↓</b></span></div>
            </section>

            <section className="campus-slogan-section" aria-label="Campusly slogan">
                <span className="campus-slogan-caption">CAMPUS LIFE, HAPPENING TOGETHER</span>
                <div className="campus-slogan-rail">
                    <div className="campus-slogan-track">
                        <span>SHOW UP</span><i aria-hidden="true">&#10022;</i><span>FIND YOUR PEOPLE</span><i aria-hidden="true">&#10023;</i><span>MAKE MEMORIES</span><i aria-hidden="true">&#10022;</i><span>YOUR CAMPUS, YOUR MOMENT</span><i aria-hidden="true">&#10023;</i>
                        <span aria-hidden="true">SHOW UP</span><i aria-hidden="true">&#10022;</i><span aria-hidden="true">FIND YOUR PEOPLE</span><i aria-hidden="true">&#10023;</i><span aria-hidden="true">MAKE MEMORIES</span><i aria-hidden="true">&#10022;</i><span aria-hidden="true">YOUR CAMPUS, YOUR MOMENT</span><i aria-hidden="true">&#10023;</i>
                    </div>
                </div>
                <span className="campus-slogan-caption slogan-caption-end">GOOD THINGS HAPPEN WHEN WE GET TOGETHER</span>
            </section>

            <section className="home-section explore-section" id="explore">
                <div className="section-heading">
                    <div className="section-heading-copy"><p className="eyebrow">FIND YOUR PEOPLE</p><h2>What&#39;s happening<span className="heading-period">.</span></h2><span className="explore-count">{events.length} {events.length === 1 ? "campus event" : "campus events"}</span></div>
                    <Link className="text-link" to="/login?next=/student/events">See all events <span aria-hidden="true">&#8599;</span></Link>
                </div>
                {error && <p className="home-error" role="status">{error}</p>}
                {shownEvents.length ? <div className="home-event-grid">
                    {shownEvents.map((event, index) => <Link className="home-event-card" key={event._id} to={`/login?next=${encodeURIComponent(`/student/events/${event._id}`)}`} onPointerMove={(pointerEvent) => {
                        if (pointerEvent.pointerType !== "mouse") return;
                        const bounds = pointerEvent.currentTarget.getBoundingClientRect();
                        const x = pointerEvent.clientX - bounds.left;
                        const y = pointerEvent.clientY - bounds.top;
                        pointerEvent.currentTarget.style.setProperty("--card-pointer-x", `${x}px`);
                        pointerEvent.currentTarget.style.setProperty("--card-pointer-y", `${y}px`);
                        pointerEvent.currentTarget.style.setProperty("--card-rotate-x", `${((bounds.height / 2 - y) / bounds.height) * 7}deg`);
                        pointerEvent.currentTarget.style.setProperty("--card-rotate-y", `${((x - bounds.width / 2) / bounds.width) * 9}deg`);
                        pointerEvent.currentTarget.classList.add("is-card-pointing");
                    }} onPointerLeave={(pointerEvent) => {
                        pointerEvent.currentTarget.style.setProperty("--card-rotate-x", "0deg");
                        pointerEvent.currentTarget.style.setProperty("--card-rotate-y", "0deg");
                        pointerEvent.currentTarget.classList.remove("is-card-pointing");
                    }}>
                        <div className="event-art">
                            {event.imageUrl ? <img src={event.imageUrl} alt="" loading="lazy" /> : <><span className="event-art-shape" /><span className="event-art-mark">{eventMarks[index % eventMarks.length]}</span><span className="event-art-word">{event.category || "CAMPUS"}</span></>}
                            <span className="event-date-chip">{formatEventDate(event.date)}</span>
                        </div>
                        <div className="event-card-info"><div className="event-card-category">{event.category || "Campus event"}</div><h3>{event.name}</h3><p><span aria-hidden="true">⌖</span> {event.location || "Campus venue"}</p><div className="event-card-bottom"><span>Discover event</span><b aria-hidden="true">↗</b></div></div>
                    </Link>)}
                </div> : <div className="home-empty" onPointerMove={(pointerEvent) => {
                    if (pointerEvent.pointerType !== "mouse") return;
                    const bounds = pointerEvent.currentTarget.getBoundingClientRect();
                    pointerEvent.currentTarget.style.setProperty("--empty-light-x", `${pointerEvent.clientX - bounds.left}px`);
                    pointerEvent.currentTarget.style.setProperty("--empty-light-y", `${pointerEvent.clientY - bounds.top}px`);
                }} onPointerLeave={(pointerEvent) => {
                    pointerEvent.currentTarget.style.setProperty("--empty-light-x", "18%");
                    pointerEvent.currentTarget.style.setProperty("--empty-light-y", "50%");
                }}>
                    <span className="home-empty-mark" aria-hidden="true">&#10022;</span>
                    <div><h3>{search ? "No matching events" : "Your next campus moment is on its way"}</h3><p>{search ? "Try another name, category, or place." : "Published campus events will show up here as soon as they are ready."}</p></div>
                    {search ? <button type="button" onClick={() => setSearch("")}>Clear search</button> : <Link to="/login?next=/student/events">Explore events <span aria-hidden="true">&#8599;</span></Link>}
                </div>}
            </section>

            <section className="home-proof-strip" aria-label="Campus event overview">
                <div><AnimatedCounter value={events.length} /><span>listed events</span></div>
                <div><AnimatedCounter value={categories.length} /><span>event categories</span></div>
                <div><AnimatedCounter value={events.filter((event) => Number(event.fee || 0) === 0).length} /><span>free to attend</span></div>
                <p>All numbers update from your campus event listings.</p>
            </section>

            <section className="category-strip" aria-label="Event categories" onPointerMove={(event) => {
                if (event.pointerType !== "mouse") return;
                const bounds = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty("--category-pointer-x", `${event.clientX - bounds.left}px`);
                event.currentTarget.style.setProperty("--category-pointer-y", `${event.clientY - bounds.top}px`);
                event.currentTarget.classList.add("is-pointing");
            }} onPointerLeave={(event) => event.currentTarget.classList.remove("is-pointing")}>
                <div className="category-intro"><p className="eyebrow">FOLLOW YOUR CURIOSITY</p><h2>Pick a<br />starting point.</h2></div>
                <div className="category-list">{categories.length ? categories.map(([category, count], index) => <button type="button" key={category} onClick={() => { setSearch(category); document.querySelector("#explore")?.scrollIntoView({ behavior: "smooth" }); }} className={`category-item category-${index}`}><span className="category-symbol">{["✳", "◈", "✦", "◒"][index]}</span><span className="category-name">{category}</span><span className="category-count">{count} {count === 1 ? "event" : "events"}</span><span className="category-arrow" aria-hidden="true">↗</span></button>) : <p className="category-empty">Explore events as they’re added by your campus.</p>}</div>
            </section>

            <section className="home-manifesto" id="how-it-works">
                <div className="manifesto-atmosphere" aria-hidden="true"><span className="manifesto-glow manifesto-glow-one" /><span className="manifesto-glow manifesto-glow-two" /><span className="manifesto-glow manifesto-glow-three" /><i className="manifesto-spark spark-a">✦</i><i className="manifesto-spark spark-b">✧</i><i className="manifesto-spark spark-c">✦</i><i className="manifesto-spark spark-d">✧</i></div>
                <div className="manifesto-index">01 / SHOW UP</div>
                <div className="manifesto-copy"><p className="eyebrow">MORE THAN A CALENDAR</p><h2>Your campus is full of<br /><em>almost-missed moments.</em></h2><p>Campusly brings them into one place. Find something that sparks your interest, save your spot, and see where the day takes you.</p><Link className="manifesto-link" to="/signup">Find your next thing <span aria-hidden="true">↗</span></Link></div>
                <div className="manifesto-visual" aria-hidden="true"><div className="manifesto-circle circle-large"><span>SHOW</span><span>UP</span></div><div className="manifesto-circle circle-small">&#10022;</div><div className="manifesto-label">MAKE IT<br />A CAMPUS<br />THING.</div></div>
            </section>

            <footer className="home-footer"><Link className="brand footer-brand" to="/" aria-label="Campusly home"><span>Campusly</span></Link><span>Good things happen when we get together.</span><div><Link to="/login">Log in</Link><Link to="/signup">Join your campus ↗</Link></div></footer>
        </main>
    );
}
