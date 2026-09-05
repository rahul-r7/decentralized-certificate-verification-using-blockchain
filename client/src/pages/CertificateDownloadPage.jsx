import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  X,
} from "lucide-react";
import api from "../services/api";

export default function CertificateDownloadPage() {
  const [regNoInput, setRegNoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!regNoInput.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setDownloadInfo(null);

    try {
      const res = await api.get(`/certificates/download-info/${encodeURIComponent(regNoInput.trim().toUpperCase())}`);
      setDownloadInfo(res);
    } catch (err) {
      console.warn("Certificate download lookup error:", err);
      if (err.data) {
        setDownloadInfo(err.data);
      } else {
        setErrorMsg(err.message || "Failed to locate certificate.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (regNo) => {
    setRegNoInput(regNo);
    setLoading(true);
    setErrorMsg("");
    setDownloadInfo(null);

    api.get(`/certificates/download-info/${encodeURIComponent(regNo)}`)
      .then((res) => setDownloadInfo(res))
      .catch((err) => setDownloadInfo(err.data || { available: false, message: err.message }))
      .finally(() => setLoading(false));
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-800 border border-brand-300 rounded-full text-xs font-semibold uppercase tracking-wider">
          <FileText className="w-4 h-4 text-brand-600" />
          Public Student Credentials Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Download Academic Certificate</h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          Students can view and download official IPFS-stored certificates using their Registration Number once approved and confirmed on the Ethereum blockchain. No login required.
        </p>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-2xl mx-auto space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Enter Registration Number
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                placeholder="e.g. REG-2026-CS001"
                value={regNoInput}
                onChange={(e) => setRegNoInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Find Certificate</span>
              </button>
            </div>
          </div>
        </form>

        {/* Demo Presets */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Test Demo Record:</span>
          <button
            type="button"
            onClick={() => handleDemoSelect("REG-2026-CS001")}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-medium rounded border border-slate-300"
          >
            REG-2026-CS001
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="max-w-2xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Display Card */}
      {downloadInfo && (
        <div className="max-w-2xl mx-auto">
          {downloadInfo.available ? (
            /* AVAILABLE FOR DOWNLOAD CARD */
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden">
              <div className="bg-emerald-600 text-white p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">✓ Certificate Available</h2>
                  <p className="text-emerald-100 text-xs font-medium">
                    Batch Confirmed on Ethereum Blockchain & IPFS Storage Ready
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Details Grid */}
                <div className="grid sm:grid-cols-2 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Student Name</span>
                    <span className="font-bold text-slate-900">{downloadInfo.studentName}</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Registration Number</span>
                    <span className="font-mono font-bold text-brand-700">{downloadInfo.registrationNumber}</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Programme</span>
                    <span className="font-semibold text-slate-800">{downloadInfo.programme}</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Institution</span>
                    <span className="font-semibold text-slate-800">{downloadInfo.institutionName}</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Issue Date</span>
                    <span className="font-semibold text-slate-800">{downloadInfo.issueDate}</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Status</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      ✓ Blockchain Confirmed
                    </span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPdfModal(true)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition shadow-md flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Certificate</span>
                    </button>

                    <a
                      href={`${API_BASE_URL}/certificates/download/${encodeURIComponent(downloadInfo.registrationNumber)}`}
                      download
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-md flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>
                  </div>

                  <Link
                    to={`/verify/${encodeURIComponent(downloadInfo.registrationNumber)}`}
                    className="px-4 py-2.5 text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 font-semibold text-sm rounded-xl transition flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Cryptographic Proof</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* UNAVAILABLE / PENDING CARD */
            <div className="bg-white rounded-2xl border-2 border-amber-500 shadow-xl overflow-hidden">
              <div className="bg-amber-500 text-slate-950 p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-8 h-8 text-slate-950" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">✕ Certificate Download Unavailable</h2>
                  <p className="text-slate-900 text-xs font-semibold">
                    Approval or Blockchain Commitment in progress.
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-sm text-slate-800">
                  <div className="font-bold text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Status: {downloadInfo.batchStatus || downloadInfo.status || "PENDING"}</span>
                  </div>
                  <p>{downloadInfo.message}</p>
                </div>

                {downloadInfo.studentName && (
                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div>Student: <span className="font-semibold text-slate-900">{downloadInfo.studentName}</span></div>
                    <div>Registration No: <span className="font-mono font-semibold text-slate-900">{downloadInfo.registrationNumber}</span></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF View Modal */}
      {showPdfModal && downloadInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-base">Certificate PDF Viewer - {downloadInfo.registrationNumber}</h3>
              </div>
              <button onClick={() => setShowPdfModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded PDF iframe */}
            <div className="flex-1 bg-slate-100 p-2">
              <iframe
                src={`${API_BASE_URL}/certificates/view/${encodeURIComponent(downloadInfo.registrationNumber)}`}
                className="w-full h-full rounded-xl border border-slate-300 shadow-inner"
                title="Certificate PDF Viewer"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono">IPFS Streamed Document</span>
              <a
                href={`${API_BASE_URL}/certificates/download/${encodeURIComponent(downloadInfo.registrationNumber)}`}
                download
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Attachment</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
