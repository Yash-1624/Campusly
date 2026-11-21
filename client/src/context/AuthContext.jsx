import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);
const getStoredToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
const SESSION_MS = { student: 60 * 60 * 1000, admin: 2 * 60 * 60 * 1000, volunteer: 3 * 60 * 60 * 1000 };

const getSessionExpiry = (token) => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const issuedAt = Number(payload.iat) * 1000;
        const tokenExpiry = Number(payload.exp) * 1000;
        const roleExpiry = issuedAt + (SESSION_MS[payload.role] || SESSION_MS.student);
        return Math.min(tokenExpiry, roleExpiry);
    } catch {
        return 0;
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [expiresAt, setExpiresAt] = useState(null);
    const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

    const logout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("session-expires-at");
        sessionStorage.removeItem("session-expires-at");
        setUser(null);
        setExpiresAt(null);
    };

    const login = async (email, password, rememberMe = true, portal = "student") => {
        const { data } = await api.post("/auth/login", {
            email,
            password,
            portal,
        });

        if (!data.token) {
            throw new Error("Login response did not contain a token.");
        }

        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("session-expires-at");
        sessionStorage.removeItem("session-expires-at");
        const tokenExpiry = getSessionExpiry(data.token);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("session-expires-at", String(tokenExpiry));
        sessionStorage.removeItem("remember-me-after-verification");

        const loggedInUser = data.user;

        if (!loggedInUser) {
            throw new Error("Login response did not contain user information.");
        }

        setUser(loggedInUser);
        setExpiresAt(tokenExpiry);

        return data;
    };

    useEffect(() => {
        const token = getStoredToken();

        if (!token) {
            return;
        }

        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        const storedExpiry = Number(storage.getItem("session-expires-at"));
        const tokenExpiry = getSessionExpiry(token);
        const effectiveExpiry = storedExpiry ? Math.min(storedExpiry, tokenExpiry) : tokenExpiry;
        if (!effectiveExpiry || effectiveExpiry <= Date.now()) {
            logout();
            setLoading(false);
            return;
        }
        storage.setItem("session-expires-at", String(effectiveExpiry));
        setExpiresAt(effectiveExpiry);

        api
            .get("/auth/me")
            .then(({ data }) => {
                setUser(data.user);
            })
            .catch(() => {
                logout();
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!user || !expiresAt) return undefined;
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
            logout();
            return undefined;
        }
        const timer = window.setTimeout(logout, remaining);
        return () => window.clearTimeout(timer);
    }, [user, expiresAt]);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
