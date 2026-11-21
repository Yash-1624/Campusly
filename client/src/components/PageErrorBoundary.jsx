import { Component } from "react";
import { Link } from "react-router-dom";

export default class PageErrorBoundary extends Component {
    state = { hasError: false, errorMessage: "" };

    static getDerivedStateFromError(error) {
        return { hasError: true, errorMessage: error?.message || "Unknown rendering error" };
    }

    componentDidCatch(error, info) {
        console.error("Page rendering error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <main className="container" role="alert" style={{ paddingBlock: "48px" }}>
                    <section className="card" style={{ maxWidth: "680px", margin: "0 auto", padding: "28px" }}>
                        <p className="login-eyebrow">PAGE ERROR</p>
                        <h1>This page could not be displayed</h1>
                        <p className="page-subtitle">The rest of the app is still available. Return to the admin overview or reload this page.</p>
                        <details open style={{ margin: "16px 0", color: "#687386" }}>
                            <summary>What went wrong?</summary>
                            <code style={{ display: "block", marginTop: "8px", overflowWrap: "anywhere" }}>{this.state.errorMessage}</code>
                        </details>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <Link className="button primary" to="/control-center/dashboard">Admin overview</Link>
                            <button className="button outline" type="button" onClick={() => window.location.reload()}>Reload page</button>
                        </div>
                    </section>
                </main>
            );
        }
        return this.props.children;
    }
}
