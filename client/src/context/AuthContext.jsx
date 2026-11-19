import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);
const getStoredToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

    const logout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setUser(null);
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
        (rememberMe ? localStorage : sessionStorage).setItem("token", data.token);
        sessionStorage.removeItem("remember-me-after-verification");

        const loggedInUser = data.user;

        if (!loggedInUser) {
            throw new Error("Login response did not contain user information.");
        }

        setUser(loggedInUser);

        return data;
    };

    useEffect(() => {
        const token = getStoredToken();

        if (!token) {
            return;
        }

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
