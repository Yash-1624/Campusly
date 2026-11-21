const paths = {
    collection: <><rect x="3.5" y="4.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="4.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="14.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="14.5" width="7" height="7" rx="1.5" /></>,
    check: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.3 2.3 4.8-5" /></>,
    pause: <><circle cx="12" cy="12" r="8.5" /><path d="M10 9v6m4-6v6" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19zM16 5.5a3 3 0 0 1 0 5.8M17 13a4.3 4.3 0 0 1 3.5 4.3V19h-3" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3.5v4m8-4v4M4 10h16m-12 4h2m3 0h2m-7 3h2" /></>,
    calendarCheck: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3.5v4m8-4v4M4 10h16m4 3-3 3-1.5-1.5" /></>,
    calendarClock: <><rect x="3.5" y="5.5" width="12" height="14" rx="2" /><path d="M7.5 3.5v4m4-4v4M3.5 10h12" /><circle cx="17" cy="16" r="4" /><path d="M17 14v2l1.2.8" /></>,
    file: <><path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V8h4M9 13h6m-6 4h6" /></>,
    ticket: <><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4v2h16v-2a2 2 0 0 1 0-4v-2a2 2 0 0 1 0-4V5H4z" /><path d="M13 7v2m0 3v2m0 3v1" /></>,
    mailCheck: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6m-6 9 1.5 1.5L19 14" /></>,
    shield: <><path d="M12 3.5 19 6v5c0 4.4-2.9 7.7-7 9.5-4.1-1.8-7-5.1-7-9.5V6z" /><path d="m9 12 2 2 4-4" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></>,
    scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3M7 12h10" /></>,
    spark: <><path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
};

const iconFor = (item) => {
    if (item.icon && item.icon !== "?") return item.icon;
    const label = String(item.label || "").toLowerCase();
    if (label.includes("category")) return "collection";
    if (label.includes("open")) return "calendarCheck";
    if (label === "active" || label.includes("confirmed")) return "check";
    if (label === "inactive") return "pause";
    if (label.includes("participant") || label.includes("student") || label.includes("volunteer") || label.includes("registration")) return "users";
    if (label.includes("pending")) return "clock";
    if (label.includes("upcoming")) return "calendarClock";
    if (label.includes("draft")) return "file";
    if (label.includes("allocation")) return "ticket";
    if (label.includes("assigned event") || label === "events" || label.includes("all events")) return "calendar";
    if (label.includes("verified")) return "mailCheck";
    if (label.includes("verification")) return "shield";
    if (label.includes("search") || label.includes("matching")) return "search";
    if (label.includes("entry")) return "scan";
    return "spark";
};

function AdminStatIcon({ item }) {
    const icon = iconFor(item);
    return <span className="admin-stats-icon" aria-hidden="true">
        {paths[icon] ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[icon]}</svg> : icon}
    </span>;
}

export default function AdminStatsBoard({ items = [] }) {
    const cards = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!cards.length) return null;
    return <section className="admin-stats-board" aria-label="Page summary">
        {cards.map((item, index) => <article className={`admin-stats-card tone-${item.tone || index % 4}`} key={item.label || `summary-${index}`}>
            <AdminStatIcon item={item} />
            <div><small>{item.label}</small><strong>{Number(item.value || 0).toLocaleString()}</strong>{item.note && <span>{item.note}</span>}</div>
        </article>)}
    </section>;
}
