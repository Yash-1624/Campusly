import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import "./PrivacyControls.css";

const CONSENT_COOKIE = "campusly_privacy";
const VISITOR_COOKIE = "campusly_visitor";
const readCookie = (name) => document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
const getConsent = () => {
    try { return JSON.parse(decodeURIComponent(readCookie(CONSENT_COOKIE))) || {}; }
    catch { return {}; }
};
const persistCookie = (name, value, days) => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${days * 86400}; SameSite=Lax${secure}`;
};
const visitorId = () => {
    let id = readCookie(VISITOR_COOKIE);
    if (!id) {
        id = crypto.randomUUID?.() || `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
        persistCookie(VISITOR_COOKIE, id, 90);
    }
    return id;
};

export default function PrivacyControls() {
    const location = useLocation();
    const [consent, setConsent] = useState(getConsent);
    const [open, setOpen] = useState(() => !readCookie(CONSENT_COOKIE));
    const [locationMessage, setLocationMessage] = useState("");
    const hasAllPermissions = consent.analytics === true && consent.location === true;

    const saveConsent = (next) => {
        setConsent(next);
        persistCookie(CONSENT_COOKIE, JSON.stringify(next), 180);
        setOpen(false);
        window.dispatchEvent(new Event("campusly:privacy-updated"));
    };

    useEffect(() => {
        if (!consent.analytics) return;
        const path = location.pathname.replace(/[a-f\d]{24}/gi, ":id").replace(/\d{5,}/g, ":id").slice(0, 180);
        api.post("/analytics/collect", { visitorId: visitorId(), type: "page_view", path }).catch(() => {});
    }, [location.pathname, consent.analytics]);

    useEffect(() => {
        const refresh = () => setConsent(getConsent());
        window.addEventListener("campusly:privacy-updated", refresh);
        return () => window.removeEventListener("campusly:privacy-updated", refresh);
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) { setLocationMessage("Location access is not available in this browser."); return; }
        setLocationMessage("Waiting for your browser’s permission…");
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            const next = { ...consent, location: true };
            persistCookie(CONSENT_COOKIE, JSON.stringify(next), 180);
            setConsent(next);
            setLocationMessage("Location permission saved. Only an approximate area is shared.");
            try {
                await api.post("/analytics/collect", {
                    visitorId: visitorId(), type: "location", latitude: Number(coords.latitude.toFixed(2)), longitude: Number(coords.longitude.toFixed(2)),
                });
            } catch { setLocationMessage("Permission is on, but the approximate area could not be saved."); }
        }, (error) => setLocationMessage(error.code === 1 ? "Location permission was denied. You can change it in browser settings." : "Could not get your location. Try again when location is available."), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    };

    return (
        <>
            {open ? <section className="privacy-panel" role="dialog" aria-label="Privacy choices">
                <div className="privacy-copy"><strong>Your privacy choices</strong><p>A cookie remembers your choice. Optional anonymous page analytics help us improve Campusly. Location is separate and shared only when you allow it.</p>{locationMessage && <small role="status">{locationMessage}</small>}</div>
                <div className="privacy-actions">
                    <button type="button" className="privacy-secondary" onClick={() => saveConsent({ analytics: false, location: false })}>Reject optional</button>
                    <button type="button" className="privacy-secondary" onClick={requestLocation}>Allow location</button>
                    <button type="button" className="privacy-primary" onClick={() => saveConsent({ analytics: true, location: consent.location })}>Accept analytics</button>
                </div>
            </section> : !hasAllPermissions && <button className="privacy-reopen" type="button" onClick={() => setOpen(true)}>Privacy settings</button>}
            {open && readCookie(CONSENT_COOKIE) && <button type="button" className="privacy-close" onClick={() => setOpen(false)} aria-label="Close privacy choices">×</button>}
        </>
    );
}
