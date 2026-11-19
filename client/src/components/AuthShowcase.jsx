import "./AuthShowcase.css";

export default function AuthShowcase({ mode = "signup" }) {
    const isSignup = mode === "signup";

    const moveArtwork = (event) => {
        if (event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        const art = event.currentTarget;
        art.style.setProperty("--auth-rotate-x", `${y * -12}deg`);
        art.style.setProperty("--auth-rotate-y", `${x * 16}deg`);
        art.style.setProperty("--auth-front-x", `${x * 18}px`);
        art.style.setProperty("--auth-front-y", `${y * 15}px`);
        art.style.setProperty("--auth-back-x", `${x * -12}px`);
        art.style.setProperty("--auth-back-y", `${y * -10}px`);
        art.classList.add("is-pointing");
    };

    const resetArtwork = (event) => {
        event.currentTarget.classList.remove("is-pointing");
        ["--auth-rotate-x", "--auth-rotate-y", "--auth-front-x", "--auth-front-y", "--auth-back-x", "--auth-back-y"].forEach((name) => event.currentTarget.style.removeProperty(name));
    };

    return (
        <aside className="auth-showcase" aria-label="Campusly introduction">
            <div className="auth-showcase-copy">
                <p className="auth-showcase-kicker"><span /> CAMPUSLY · COLLEGE EVENTS</p>
                <h2>{isSignup ? <>Your next great<br /><em>campus story</em><br />starts here.</> : <>Find your next<br /><em>campus moment.</em></>}</h2>
                <p className="auth-showcase-description">
                    Discover your community, meet new people, and make every campus moment count.
                </p>
                <button className="auth-scroll-button" type="button" onClick={() => document.querySelector(".auth-page-student .form-card")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                    <span aria-hidden="true">↓</span> Continue to form
                </button>
            </div>

            <div className="auth-showcase-art" aria-hidden="true" onPointerMove={moveArtwork} onPointerLeave={resetArtwork}>
                <span className="auth-orbit auth-orbit-one" />
                <span className="auth-orbit auth-orbit-two" />
                <span className="auth-glow" />
                <div className="auth-stage-scene">
                    <span className="auth-beam auth-beam-one" />
                    <span className="auth-beam auth-beam-two" />
                    <span className="auth-stage-ring" />
                    <span className="auth-disco-ball"><i /></span>
                    <span className="auth-scene-spark spark-a">✦</span>
                    <span className="auth-scene-spark spark-b">✧</span>
                    <span className="auth-scene-spark spark-c">✦</span>
                    <span className="auth-scene-spark spark-d">✧</span>
                    <span className="auth-scene-spark spark-e">✦</span>
                </div>
                <div className="auth-platform"><span /></div>
                <div className="auth-calendar">
                    <div className="auth-calendar-rings"><i /><i /></div>
                    <div className="auth-calendar-head"><span className="auth-calendar-mark">&#10022;</span><span className="auth-calendar-lines"><i /><i /></span></div>
                    <div className="auth-calendar-week"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
                    <div className="auth-calendar-grid">{Array.from({ length: 14 }, (_, index) => <i key={index} className={index === 2 ? "is-selected" : index === 5 ? "is-blue" : index === 10 ? "is-violet" : ""}>{12 + index}</i>)}</div>
                    <span className="auth-calendar-orb" />
                </div>
                <div className="auth-ticket-3d">
                    <span className="auth-ticket-kicker">CAMPUSLY · EVENT PASS</span>
                    <strong>MAKE<br />A MOMENT</strong>
                    <span className="auth-ticket-meta"><i /> <i /> <i /></span>
                    <span className="auth-ticket-notch" />
                </div>
                <div className="auth-poster-3d">
                    <span className="auth-poster-topline">CAMPUSLY <i>2026</i></span>
                    <span className="auth-poster-orb">✦</span>
                    <span className="auth-poster-live">LIVE EVENT</span>
                    <strong>MAKE<br />SOME<br /><em>MEMORIES</em></strong>
                    <small>FESTIVAL · MUSIC · PEOPLE</small>
                </div>
                <span className="auth-floating-star star-one">&#10022;</span>
                <span className="auth-floating-star star-two">&#10023;</span>
                <span className="auth-floating-dot dot-one" />
            </div>
        </aside>
    );
}
