import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "./Loading";

export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) return <Loading />;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== "student") {
        return <Navigate to={user.role === "admin" ? "/control-center/dashboard" : "/volunteer/dashboard"} replace />;
    }

    return <Outlet />;
}
