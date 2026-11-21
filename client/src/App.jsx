import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar
  from "./components/Navbar";
import DashboardSidebar from "./components/DashboardSidebar";

import ProtectedRoute
  from "./components/ProtectedRoute";

import AdminRoute
  from "./components/AdminRoute";
import VolunteerRoute from "./components/VolunteerRoute";
import Loading from "./components/Loading";
import CampuslyChatbot from "./components/CampuslyChatbot";
import PrivacyControls from "./components/PrivacyControls";
import PageErrorBoundary from "./components/PageErrorBoundary";
import { useAuth } from "./context/AuthContext";

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const Events = lazy(() => import("./pages/student/Events"));
const EventDetails = lazy(() => import("./pages/student/EventDetails"));
const EventRegistration = lazy(() => import("./pages/student/EventRegistration"));
const Payment = lazy(() => import("./pages/student/Payment"));
const RegistrationSuccess = lazy(() => import("./pages/student/RegistrationSuccess"));
const MyRegistrations = lazy(() => import("./pages/student/MyRegistrations"));
const RegistrationDetails = lazy(() => import("./pages/student/RegistrationDetails"));
const Profile = lazy(() => import("./pages/student/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageEvents = lazy(() => import("./pages/admin/ManageEvents"));
const AddEvent = lazy(() => import("./pages/admin/AddEvent"));
const EditEvent = lazy(() => import("./pages/admin/EditEvent"));
const ManageCategories = lazy(() => import("./pages/admin/ManageCategories"));
const ManageRegistrations = lazy(() => import("./pages/admin/ManageRegistrations"));
const AdminRegistrationDetails = lazy(() => import("./pages/admin/RegistrationDetails"));
const ManageStudents = lazy(() => import("./pages/admin/ManageStudents"));
const StudentDetails = lazy(() => import("./pages/admin/StudentDetails"));
const ManagePayments = lazy(() => import("./pages/admin/ManagePayments"));
const ManageVolunteers = lazy(() => import("./pages/admin/ManageVolunteers"));
const EntryLog = lazy(() => import("./pages/admin/EntryLog"));
const SiteInsights = lazy(() => import("./pages/admin/SiteInsights"));
const VolunteerDashboard = lazy(() => import("./pages/volunteer/VolunteerDashboard"));
const HomePage = lazy(() => import("./pages/HomePage"));


export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const chatbotEnabled = ["/", "/login", "/signup"].includes(location.pathname);

  return (

    <>

      {!user && <Navbar />}
      <PrivacyControls />
      {chatbotEnabled && <CampuslyChatbot />}

      <div className={user && ["student", "admin"].includes(user.role) ? `authenticated-layout${user.role === "admin" ? " admin-workspace" : ""}` : ""}>
      {user && ["student", "admin"].includes(user.role) && <DashboardSidebar role={user.role} />}
      <div className={user && ["student", "admin"].includes(user.role) ? "authenticated-content" : ""}>
      <Suspense fallback={<Loading />}>
      <PageErrorBoundary key={location.pathname}>
      <Routes>

        {/* ------------------------------------------------ */}
        {/* PUBLIC */}
        {/* ------------------------------------------------ */}

        <Route
          path="/"
          element={loading
            ? <Loading />
            : user
            ? <Navigate to={user.role === "admin" ? "/control-center/dashboard" : user.role === "volunteer" ? "/volunteer/dashboard" : "/student"} replace />
            : <HomePage />}
        />

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        {/* Separate administrator sign-in; never linked from student pages. */}
        <Route path="/control-center" element={<Login adminMode />} />
        <Route path="/volunteer-access" element={<Login volunteerMode />} />
        <Route path="/volunteer" element={<Navigate to="/volunteer/dashboard" replace />} />

        <Route
          path="/signup"
          element={
            <Signup />
          }
        />

        <Route
          path="/verify-email"
          element={
            <VerifyEmail />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />

        <Route
          path="/reset-password"
          element={
            <ResetPassword />
          }
        />


        {/* ------------------------------------------------ */}
        {/* STUDENT */}
        {/* ------------------------------------------------ */}

        <Route
          element={
            <ProtectedRoute />
          }
        >

          <Route
            path="/student"
            element={
              <StudentDashboard />
            }
          />

          <Route
            path="/student/events"
            element={
              <Events />
            }
          />

          <Route
            path="/student/events/:id"
            element={
              <EventDetails />
            }
          />

          <Route
            path="/student/events/:id/register"
            element={
              <EventRegistration />
            }
          />

          <Route
            path="/student/payment/:registrationId"
            element={
              <Payment />
            }
          />

          <Route
            path="/student/registration-success/:id"
            element={
              <RegistrationSuccess />
            }
          />

          <Route
            path="/student/registrations"
            element={
              <MyRegistrations />
            }
          />

          <Route
            path="/student/registrations/:id"
            element={
              <RegistrationDetails />
            }
          />

          <Route
            path="/student/profile"
            element={
              <Profile />
            }
          />

        </Route>


        {/* ------------------------------------------------ */}
        {/* ADMIN */}
        {/* ------------------------------------------------ */}

        <Route
          element={
            <AdminRoute />
          }
        >

          <Route
            path="/control-center/dashboard"
            element={
              <AdminDashboard />
            }
          />

          <Route
            path="/control-center/events"
            element={
              <ManageEvents />
            }
          />

          <Route
            path="/control-center/events/add"
            element={
              <AddEvent />
            }
          />

          <Route
            path="/control-center/events/edit/:id"
            element={
              <EditEvent />
            }
          />

          <Route
            path="/control-center/registrations"
            element={
              <ManageRegistrations />
            }
          />

          <Route
            path="/control-center/registrations/:id"
            element={
              <AdminRegistrationDetails />
            }
          />

          <Route
            path="/control-center/students"
            element={
              <ManageStudents />
            }
          />

          <Route
            path="/control-center/students/:id"
            element={
              <StudentDetails />
            }
          />

          <Route
            path="/control-center/categories"
            element={
              <ManageCategories />
            }
          />

          <Route path="/control-center/payments" element={<ManagePayments />} />
          <Route path="/control-center/volunteers" element={<ManageVolunteers />} />
          <Route path="/control-center/entries" element={<EntryLog />} />
          <Route path="/control-center/insights" element={<SiteInsights />} />

        </Route>


        {/* VOLUNTEER PORTAL */}
        <Route element={<VolunteerRoute />}>
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
        </Route>

        {/* ------------------------------------------------ */}
        {/* FALLBACK */}
        {/* ------------------------------------------------ */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
      </PageErrorBoundary>
      </Suspense>
      </div>
      </div>

    </>

  );

}
