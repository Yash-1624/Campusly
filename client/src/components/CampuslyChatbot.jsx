import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import "./CampuslyChatbot.css";

const starterQuestions = ["Show upcoming events", "How do I register?", "OTP not received", "I can’t log in"];
const greeting = "Hi! I’m Campusly Help. Ask me about events, registration, login, or email verification.";

function eventDate(value) {
    if (!value) return "Date TBA";
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}

function eventAnswer(events = []) {
    const upcoming = events
        .filter((event) => !event.date || new Date(event.date).getTime() >= Date.now())
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        .slice(0, 5);
    if (!upcoming.length) return "I couldn’t find any upcoming events right now. Check the Events page again soon—new campus events may be added at any time.";
    return `Here are some upcoming campus events:\n${upcoming.map((event) => `• ${event.name} · ${eventDate(event.date)} · ${event.location || "Venue TBA"} · ${Number(event.fee || 0) > 0 ? `₹${Number(event.fee).toLocaleString("en-IN")}` : "Free"}`).join("\n")}\n\nOpen Explore Events on the home page to see more.`;
}

function answerFor(question, events) {
    const text = question.toLowerCase().trim();
    if (/\b(hi|hello|hey|good morning|good evening)\b/.test(text)) return greeting;
    if (/\b(register|registration|sign up for|join|book|participate)\b/.test(text)) return "To register: log in or create a student account, verify your email, open an event, and choose Register. Complete payment if the event has a fee. Your QR ticket appears in My Registrations after confirmation.";
    if (/\b(event|events|upcoming|happening|schedule|what'?s on|show me)\b/.test(text)) return eventAnswer(events);
    if (/\b(otp|verification code|verify|email code)\b/.test(text)) return "Check that you entered the right email, then check Inbox, Spam, and Promotions. On the sign-up page, use Resend Verification OTP if it’s available. Never share your OTP or password in chat.";
    if (/\b(login|log in|sign in|password|forgot)\b/.test(text)) return "Use the student Login page with your registered email and password. New accounts must verify their email first. If you forgot your password, choose Forgot Password on the login page.";
    if (/\b(fee|price|cost|payment|paid|free|refund)\b/.test(text)) return "Event fees are shown on each event card and details page. Events marked Free don’t require payment. For a payment issue, keep your transaction reference and contact your college event administrator.";
    if (/\b(ticket|qr|entry|check.?in)\b/.test(text)) return "After your registration is confirmed, open My Registrations and select View to find your QR entry ticket. Show it to the event team at check-in.";
    if (/\b(volunteer|admin|administrator|organizer|organiser|contact|human|help desk)\b/.test(text)) return "Volunteer access is created by your event administrator. For account, payment, or event-specific help that I can’t resolve, contact your college event administrator.";
    return "I can help with upcoming events, event registration, login and password recovery, OTP verification, payments, and QR tickets. What would you like help with?";
}

export default function CampuslyChatbot() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([{ role: "assistant", text: greeting }]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const listRef = useRef(null);
    const eventsRequested = useRef(false);

    useEffect(() => {
        if (!open || eventsRequested.current) return;
        eventsRequested.current = true;
        api.get("/events").then(({ data }) => setEvents(Array.isArray(data.events) ? data.events : [])).catch(() => setEvents([]));
    }, [open]);

    useEffect(() => {
        if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, open, loading]);

    const send = (value = input) => {
        const question = value.trim();
        if (!question || loading) return;
        setInput("");
        setMessages((current) => [...current, { role: "user", text: question }]);
        setLoading(true);
        window.setTimeout(() => {
            setMessages((current) => [...current, { role: "assistant", text: answerFor(question, events) }]);
            setLoading(false);
        }, 260);
    };

    return (
        <div className="campusly-chatbot">
            {open && <section className="campusly-chat-panel" aria-label="Campusly help chat">
                <header className="campusly-chat-header">
                    <span className="campusly-chat-avatar" aria-hidden="true">C</span>
                    <div><strong>Campusly Help</strong><small>Event and account support</small></div>
                    <button type="button" className="campusly-chat-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
                </header>
                <div className="campusly-chat-messages" ref={listRef} aria-live="polite">
                    {messages.map((message, index) => <div className={`campusly-chat-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.text}</span></div>)}
                    {loading && <div className="campusly-chat-message assistant"><span className="campusly-chat-typing" aria-label="Typing"><i /><i /><i /></span></div>}
                    {messages.length === 1 && <div className="campusly-chat-suggestions">{starterQuestions.map((question) => <button type="button" key={question} onClick={() => send(question)}>{question}</button>)}</div>}
                </div>
                <form className="campusly-chat-form" onSubmit={(event) => { event.preventDefault(); send(); }}>
                    <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Campusly Help..." aria-label="Your question" maxLength={400} />
                    <button type="submit" disabled={!input.trim() || loading} aria-label="Send message">➤</button>
                </form>
                <p className="campusly-chat-note">Campusly Help · Don’t share passwords or OTPs</p>
            </section>}
            <button className={`campusly-chat-launcher${open ? " is-open" : ""}`} type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close Campusly Help" : "Chat with Campusly Help"} aria-expanded={open}>
                {open ? <span aria-hidden="true">×</span> : <><span className="campusly-chat-launcher-icon" aria-hidden="true">✦</span><span>Need help?</span></>}
            </button>
        </div>
    );
}
