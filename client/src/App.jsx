import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RoleRoute from "./components/RoleRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PublicVerificationPage from "./pages/PublicVerificationPage";
import CertificateDownloadPage from "./pages/CertificateDownloadPage";
import StaffDashboard from "./pages/StaffDashboard";
import CoeDashboard from "./pages/CoeDashboard";
import RegistrarDashboard from "./pages/RegistrarDashboard";

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/download-certificate" element={<CertificateDownloadPage />} />
            <Route path="/verify" element={<PublicVerificationPage />} />
            <Route path="/verify/:registrationNumber" element={<PublicVerificationPage />} />

            {/* Protected Role-Based Dashboards */}
            <Route
              path="/staff"
              element={
                <RoleRoute allowedRoles={["EXAMINATION_STAFF"]}>
                  <StaffDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/coe"
              element={
                <RoleRoute allowedRoles={["CONTROLLER_OF_EXAMINATIONS"]}>
                  <CoeDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/registrar"
              element={
                <RoleRoute allowedRoles={["REGISTRAR"]}>
                  <RegistrarDashboard />
                </RoleRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
