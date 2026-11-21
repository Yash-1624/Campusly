
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false, className = "" }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className={`theme-toggle ${className}${compact ? " is-compact" : ""}`.trim()}
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-pressed={isDark}
        >
            <span className="theme-toggle-icon" aria-hidden="true">
                {isDark ? "☀️" : "🌙"}
            </span>

            {!compact && <span className="theme-toggle-label">{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
    );
}
