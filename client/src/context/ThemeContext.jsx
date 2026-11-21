
import { createContext, useContext, useLayoutEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try {
            const savedTheme = localStorage.getItem("campus-theme");

            if (savedTheme === "dark" || savedTheme === "light") {
                return savedTheme;
            }
        } catch {
            // Use light mode if browser storage is unavailable.
        }

        return "light";
    });

    useLayoutEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);

        try {
            localStorage.setItem("campus-theme", theme);
        } catch {
            // The theme still works if browser storage is unavailable.
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === "light" ? "dark" : "light"
        );
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used inside ThemeProvider");
    }

    return context;
}
