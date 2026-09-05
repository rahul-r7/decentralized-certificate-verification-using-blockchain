import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, User, Lock, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(email, password);
      if (res.success) {
        switch (res.user.role) {
          case "EXAMINATION_STAFF":
            navigate("/staff");
            break;
          case "CONTROLLER_OF_EXAMINATIONS":
            navigate("/coe");
            break;
          case "REGISTRAR":
            navigate("/registrar");
            break;
          default:
            navigate("/verify");
            break;
        }
      }
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-brand-900 text-brand-300 mx-auto flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign In to CertiChain</h2>
          <p className="text-sm text-slate-500">Access your university staff portal</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@university.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-lg disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="pt-6 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Click Demo Accounts</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => fillDemoAccount("staff@nit.ac.in", "Staff@123456")}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-medium text-left border border-slate-200"
            >
              Exam Staff
            </button>
            <button
              onClick={() => fillDemoAccount("coe@nit.ac.in", "Coe@123456")}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-medium text-left border border-slate-200"
            >
              CoE (Signer #1)
            </button>
            <button
              onClick={() => fillDemoAccount("registrar@nit.ac.in", "Registrar@123456")}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-medium text-left border border-slate-200"
            >
              Registrar (Signer #2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
