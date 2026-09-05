import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Search, Lock, FileCheck, Cpu, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [regNo, setRegNo] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (regNo.trim()) {
      navigate(`/verify/${encodeURIComponent(regNo.trim())}`);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-slate-900 to-slate-950 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-900/80 border border-brand-700 text-brand-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Immutable Blockchain Academic Credentials
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Cryptographic Academic Certificate <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-400 to-teal-300">
              Verification Platform
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal">
            Eliminate degree fraud. Issue academic certificates stored on IPFS, secured by SHA-256 Merkle Trees, and immutably registered on Ethereum smart contracts.
          </p>

          {/* Quick Search Card */}
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter Student Registration Number (e.g. REG-2026-CS001)"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 flex-shrink-0"
              >
                <span>Verify Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left border-t border-slate-800">
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-slate-400 font-medium">Cryptographic Proof</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">SHA-256</div>
              <div className="text-xs text-slate-400 font-medium">Canonical Hashing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-400">EIP-712</div>
              <div className="text-xs text-slate-400 font-medium">Multi-Signatory Approvals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-300">IPFS</div>
              <div className="text-xs text-slate-400 font-medium">Decentralized Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Architecture & Technical Capabilities</h2>
          <p className="text-slate-600 max-w-xl mx-auto">Designed for university registrars, controllers of examinations, and public verifiers.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Deterministic Canonical Merkle Trees</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Certificates are normalized into canonical strings and hashed via SHA-256. Batches form Merkle Trees, storing only the single 32-byte Merkle Root on-chain to minimize gas costs.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">EIP-712 Multi-Signatory Approvals</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Examination Staff upload records, Controller of Examinations signs an off-chain EIP-712 message with MetaMask, and the Registrar's signature triggers the final automated blockchain commit.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Instant Public Verification</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Employers and background checkers verify certificates without logging in. Supports PDF drag-and-drop upload, QR code scanning, or direct registration number lookups.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl font-bold">University Staff Portal</h3>
            <p className="text-slate-300 text-sm">
              Log in as Examination Staff, Controller of Examinations, or Registrar to issue and approve degree batches.
            </p>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <Link
              to="/login"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-md"
            >
              Sign In to Staff Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
