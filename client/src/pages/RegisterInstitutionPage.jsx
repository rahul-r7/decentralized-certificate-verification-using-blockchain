import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, AlertCircle, Key, User } from "lucide-react";
import api from "../services/api";

export default function RegisterInstitutionPage() {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    address: "",
    phone: "",
    website: "",
    registrarName: "",
    registrarPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/institutions/onboard", formData);
      if (res.success) {
        setResultData(res);
      }
    } catch (err) {
      setError(err.message || "Onboarding submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">University Registration & Onboarding</h2>
            <p className="text-xs text-slate-500">Register your university to issue blockchain-verified certificates</p>
          </div>
        </div>

        {resultData ? (
          <div className="py-8 text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">University Registered Successfully!</h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                {resultData.institution.name} ({resultData.institution.code}) is now active on CertiChain.
              </p>
            </div>

            {/* Registrar Account Credentials Card */}
            <div className="p-6 bg-slate-900 text-white rounded-2xl text-left space-y-3 font-mono text-xs max-w-md mx-auto">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-sans border-b border-slate-800 pb-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Registrar Login Credentials</span>
              </div>
              <div className="space-y-1 pt-1">
                <div><span className="text-slate-400">Email:</span> <span className="text-white font-semibold">{resultData.registrarAccount.email}</span></div>
                <div><span className="text-slate-400">Password:</span> <span className="text-amber-300 font-semibold">{resultData.registrarAccount.password}</span></div>
                <div><span className="text-slate-400">Role:</span> <span className="text-emerald-400 font-semibold">REGISTRAR</span></div>
              </div>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-md gap-2"
            >
              <User className="w-4 h-4" />
              <span>Go to Sign In Portal</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Institution Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STAN-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Institutional Email *
              </label>
              <input
                type="email"
                required
                placeholder="registrar@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Physical Campus Address *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Campus Rd, Building A..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Registrar Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Dr. S. K. Gupta"
                  value={formData.registrarName}
                  onChange={(e) => setFormData({ ...formData, registrarName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Default: Registrar@123456"
                  value={formData.registrarPassword}
                  onChange={(e) => setFormData({ ...formData, registrarPassword: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-md disabled:opacity-50 mt-4"
            >
              {loading ? "Registering University..." : "Register University"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
