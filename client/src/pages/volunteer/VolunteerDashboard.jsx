import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function VolunteerDashboard() {
    const { user } = useAuth();
    const scannerRef = useRef(null);
    const busyRef = useRef(false);
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [scannerReady, setScannerReady] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.get("/volunteer/events").then(({ data }) => {
            const list = data.events || [];
            setEvents(list);
            if (list.length) setEventId(String(list[0]._id));
            if (!list.length) setError("No event has been assigned to this volunteer. Contact the administrator.");
        }).catch((err) => setError(err.response?.data?.message || "Unable to load assigned events."));
    }, []);

    const stopScanner = useCallback(async () => {
        const scanner = scannerRef.current;
        if (scanner) {
            try { if (scanner.isScanning) await scanner.stop(); } catch { /* scanner may not have started */ }
            try { await scanner.clear(); } catch { /* ignore cleanup errors */ }
            scannerRef.current = null;
        }
        setScannerReady(false);
    }, []);

    const scan = useCallback(async (decodedText) => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        setError("");
        await stopScanner();
        try {
            const { data } = await api.post("/tickets/scan", { qrPayload: decodedText, eventId });
            setResult(data.ticket || data);
        } catch (err) {
            setResult(err.response?.data?.ticket || null);
            setError(err.response?.data?.message || "Ticket scan failed.");
        } finally { busyRef.current = false; setBusy(false); }
    }, [eventId, stopScanner]);

    const startScanner = async () => {
        setError(""); setResult(null);
        if (!eventId) { setError("No assigned event is available for scanning."); return; }
        try {
            await stopScanner();
            const scanner = new Html5Qrcode("volunteer-qr-reader");
            scannerRef.current = scanner;
            await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, scan, () => {});
            setScannerReady(true);
        } catch {
            setError("Unable to start camera. Allow camera access and use HTTPS or localhost.");
        }
    };

    useEffect(() => () => { stopScanner(); }, [stopScanner]);

    const selectedEvent = events.find((event) => String(event._id) === eventId);
    return <main className="container volunteer-dashboard">
        <div className="page-heading"><div><p className="login-eyebrow">VOLUNTEER PORTAL</p><h1>Welcome, {user?.fullName}</h1><p className="page-subtitle">Scan registered participants' QR tickets at the event entrance.</p></div></div>
        <section className="card volunteer-profile-card">
            <div><strong>Volunteer ID</strong><span>{user?.loginId || user?.collegePid}</span></div>
            <div><strong>Department</strong><span>{user?.departmentName || "—"}</span></div>
            <div><strong>Assigned events</strong><span>{events.length ? events.map((event) => event.name).join(", ") : "No event assigned"}</span></div>
        </section>
        {selectedEvent && <section className="card volunteer-scanner-card">
            <h2>Selected Event Information</h2>
            <p><strong>Event:</strong> {selectedEvent.name}</p>
            <p><strong>Category:</strong> {selectedEvent.category || "—"}</p>
            <p><strong>Date:</strong> {selectedEvent.date ? new Date(selectedEvent.date).toLocaleString() : "To be announced"}</p>
            <p><strong>Location:</strong> {selectedEvent.location || "To be announced"}</p>
            {selectedEvent.description && <p><strong>Details:</strong> {selectedEvent.description}</p>}
        </section>}
        <section className="card volunteer-scanner-card">
            <h2>Event Entry Scanner</h2>
            <p>Only tickets belonging to your assigned event can be accepted.</p>
            {events.length > 1 && <label>Assigned Event<select value={eventId} onChange={(e) => { setEventId(e.target.value); setResult(null); setError(""); }}><option value="">Choose event</option>{events.map((event) => <option key={event._id} value={event._id}>{event.name}</option>)}</select></label>}
            <div id="volunteer-qr-reader" className="volunteer-qr-reader" />
            {!scannerReady && <button className="button primary" type="button" onClick={startScanner} disabled={!eventId || busy}>Open Camera Scanner</button>}
            {scannerReady && <button className="button secondary" type="button" onClick={stopScanner}>Stop Scanner</button>}
            {error && <div className="alert error" role="alert">{error}</div>}
            {result && <div className={`volunteer-scan-result ${result.entryStatus === "Entered" ? "success" : "warning"}`}><h3>{result.entryStatus === "Entered" ? "Entry confirmed" : "Scan result"}</h3><p><strong>Participant:</strong> {result.student?.fullName || result.studentName || "Unknown"}</p><p><strong>Student ID:</strong> {result.student?.collegePid || result.collegePid || "—"}</p><p><strong>Event:</strong> {result.event?.name || result.eventName || "—"}</p><p><strong>Status:</strong> {result.entryStatus || "Not confirmed"}</p>{result.enteredAt && <p><strong>Entry time:</strong> {new Date(result.enteredAt).toLocaleString()}</p>}<button className="button primary" type="button" onClick={() => { setResult(null); setError(""); startScanner(); }}>Scan Next Ticket</button></div>}
        </section>
    </main>;
}
