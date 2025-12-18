import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext.jsx'
// import { ChatProvider } from './context/ChatContext.jsx'
import Loading from './components/Loading.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import LiveChatPage from './pages/LiveChatPage.jsx'
import TherapyRoutines from './VR/TherapyRoutines.jsx' // NEW IMPORT
import { Toaster } from "sonner";
import { lazy, Suspense } from "react";
const VRTherapyApp = lazy(() => import("./VR/VRTherapyApp"));
const ARTherapyApp = lazy(() => import("./pages/ARTherapyApp"));
// Component to handle root route redirection
const RootRedirect = () => {
  const { user, loading } = useUser();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    if (user.role === "doctor") {
      return <Navigate to="/doctor-dashboard" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/patient-dashboard" replace />;
    }
  }

  return <Landing />;
};

const AppRoutes = () => {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/live-chat" element={<LiveChatPage />} />
        <Route path="/therapy-routines" element={<TherapyRoutines />} />
        <Route path="/vr-therapy/:therapyId" element={
          <Suspense fallback={<Loading message="Loading VR..." />}>
            <VRTherapyApp />
          </Suspense>
        } />
        <Route path="/ar-therapy/:therapyId" element={
          <Suspense fallback={<Loading message="Loading AR..." />}>
            <ARTherapyApp />
          </Suspense>
        } />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <UserProvider>
      {/* <ChatProvider> */}
        <AppRoutes />
        <Toaster richColors position="top-right" />
      {/* </ChatProvider> */}
    </UserProvider>
  );
};

export default App;

