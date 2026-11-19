import { useEffect, useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import Loading from "../../components/Loading";
import api from "../../services/api";

export default function SiteInsights() {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/analytics/summary").then(({ data: result }) => { if (active) setData(result); })
            .catch((err) => { if (active) setError(err.response?.data?.message || "Site insights could not be loaded."); });
        return () => { active = false; };
    }, []);

    if (!data && !error) return <Loading text="Loading site insights…" />;

    return <div className="dashboard-shell dashboard-shell-admin">
        <DashboardSidebar role="admin" />
        <main className="container admin-dashboard-page site-insights-page">
            <section className="admin-welcome"><div><p className="eyebrow">CAMPUS EVENTS / PRIVACY FIRST ANALYTICS</p><h1>Site insights</h1><p>Anonymous activity from visitors who accepted analytics, for the last 30 days.</p></div></section>
            {error && <div className="alert error" role="alert">{error}</div>}
            {data && <>
                <section className="admin-metrics" aria-label="Website activity">
                    <article className="admin-metric"><span className="admin-metric-icon">◷</span><div><small>Page views</small><strong>{data.pageViews.toLocaleString()}</strong></div></article>
                    <article className="admin-metric"><span className="admin-metric-icon">◉</span><div><small>Anonymous visitors</small><strong>{data.uniqueVisitors.toLocaleString()}</strong></div></article>
                    <article className="admin-metric"><span className="admin-metric-icon">⌖</span><div><small>Approximate areas shared</small><strong>{data.locations.length.toLocaleString()}</strong></div></article>
                </section>
                <div className="admin-dashboard-lower">
                    <section className="dashboard-panel admin-activity-panel">
                        <div className="panel-heading"><div><p className="eyebrow">DISCOVERY</p><h2>Most viewed pages</h2></div></div>
                        {data.popularPages.length ? <div className="site-insights-list">{data.popularPages.map((page) => <div className="site-insights-row" key={page.path}><strong>{page.path}</strong><span>{page.views} views · {page.visitors} visitors</span></div>)}</div> : <p>No opted-in page activity yet.</p>}
                    </section>
                    <section className="dashboard-panel admin-activity-panel">
                        <div className="panel-heading"><div><p className="eyebrow">ANONYMOUS JOURNEYS</p><h2>Pages visited</h2></div></div>
                        {data.journeys.length ? <div className="site-insights-list">{data.journeys.map((journey) => <div className="site-insights-row" key={`${journey.visitor}-${journey.lastSeen}`}><strong>{journey.visitor}</strong><span>{journey.pages.map((page) => page.path).join(" → ")}</span></div>)}</div> : <p>No journeys available.</p>}
                    </section>
                </div>
                <section className="dashboard-panel admin-activity-panel site-location-panel">
                    <div className="panel-heading"><div><p className="eyebrow">OPTIONAL LOCATION</p><h2>Approximate areas</h2></div></div>
                    <p className="site-insights-note">Location is recorded only after a visitor chooses “Allow location” and accepts the browser prompt. Coordinates are rounded to about 1 km. No name, email, or precise GPS is stored here.</p>
                    {data.locations.length ? <div className="site-insights-list">{data.locations.map((area) => <div className="site-insights-row" key={`${area.area}-${area.at}`}><strong>{area.area}</strong><span>{area.latitude.toFixed(2)}, {area.longitude.toFixed(2)} · {new Date(area.at).toLocaleString()}</span></div>)}</div> : <p>No location has been shared.</p>}
                </section>
            </>}
        </main>
    </div>;
}
