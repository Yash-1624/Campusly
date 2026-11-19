import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "./Loading";

export default function VolunteerRoute() {
    const { user, loading } = useAuth();
    if (loading) return <Loading />;
    if (!user) return <Navigate to="/volunteer-access" replace />;
    if (user.role !== "volunteer") {
        return <Navigate to={user.role === "admin" ? "/control-center/dashboard" : "/student"} replace />;
    }
    return <Outlet />;
}
