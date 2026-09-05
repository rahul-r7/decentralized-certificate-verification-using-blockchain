import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, LogOut, User, CheckCircle, Download } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/verify";
    switch (user.role) {
      case "EXAMINATION_STAFF":
        return "/staff";
      case "CONTROLLER_OF_EXAMINATIONS":
        return "/coe";
      case "REGISTRAR":
        return "/registrar";
      default:
        return "/verify";
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight flex items-center gap-2">
              CertiChain <span className="text-xs px-2 py-0.5 rounded-full bg-brand-900 text-brand-300 font-mono border border-brand-700">v1.0</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Decentralized Academic Verification System</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link
            to="/download-certificate"
            className={`hover:text-white transition flex items-center gap-1.5 ${
              location.pathname === "/download-certificate" ? "text-white font-semibold" : ""
            }`}
          >
            <Download className="w-4 h-4 text-brand-400" />
            Student Download
          </Link>

          <Link
            to="/verify"
            className={`hover:text-white transition flex items-center gap-1.5 ${
              location.pathname.startsWith("/verify") ? "text-white font-semibold" : ""
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Public Verification
          </Link>

          {user && (
            <Link
              to={getDashboardLink()}
              className="px-3 py-1.5 bg-brand-700 text-white rounded-lg hover:bg-brand-600 transition font-medium"
            >
              My Dashboard ({user.role.replace(/_/g, " ")})
            </Link>
          )}
        </nav>

        {/* User Auth Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-white">{user.name}</div>
                <div className="text-[10px] font-mono text-emerald-400">{user.role.replace(/_/g, " ")}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition shadow-md flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
