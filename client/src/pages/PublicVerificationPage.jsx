import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Search,
  Upload,
  QrCode,
  ShieldCheck,
  ExternalLink,
  Cpu,
  FileText,
  Building,
  Calendar,
  Award,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

export default function PublicVerificationPage() {
  const { registrationNumber: urlRegNo } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("REG_NO"); // "REG_NO", "PDF", "QR"
  const [regNoInput, setRegNoInput] = useState(urlRegNo || "");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (urlRegNo) {
      setRegNoInput(urlRegNo);
      verifyByRegNo(urlRegNo);
    }
  }, [urlRegNo]);

  const verifyByRegNo = async (targetRegNo) => {
    if (!targetRegNo) return;
    setLoading(true);
    setErrorMsg("");
    setVerificationResult(null);

    try {
      const res = await api.get(`/verify/registration/${encodeURIComponent(targetRegNo.trim().toUpperCase())}`);
      setVerificationResult(res);
    } catch (err) {
      console.warn("Verification failed:", err);
      setVerificationResult(err.data || { valid: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegNoSubmit = (e) => {
    e.preventDefault();
    if (regNoInput.trim()) {
      navigate(`/verify/${encodeURIComponent(regNoInput.trim())}`);
      verifyByRegNo(regNoInput.trim());
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setErrorMsg("");
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append("certificatePdf", selectedFile);

      const res = await api.post("/verify/pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVerificationResult(res);
    } catch (err) {
      setVerificationResult(err.data || { valid: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoVerify = (sampleRegNo) => {
    setRegNoInput(sampleRegNo);
    navigate(`/verify/${sampleRegNo}`);
    verifyByRegNo(sampleRegNo);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Public Verification Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Academic Certificate Verification</h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          Verify academic credential integrity against SHA-256 Merkle Roots on the Ethereum blockchain. No authentication required.
        </p>
      </div>

      {/* Tabs Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-3xl mx-auto">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab("REG_NO")}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "REG_NO"
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Search className="w-4 h-4" />
            Registration Number
          </button>

          <button
            onClick={() => setActiveTab("PDF")}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "PDF"
                ? "border-brand-600 text-brand-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Certificate PDF
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === "REG_NO" && (
            <form onSubmit={handleRegNoSubmit} className="space-y-4">
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
                    <span>Verify</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "PDF" && (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Upload PDF Certificate File
                </label>
                <p className="text-slate-500 text-xs mb-3">
                  The Registration Number will be automatically extracted from the uploaded PDF. No manual entry required.
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 border border-slate-300 rounded-xl p-2 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedFile || loading}
                className="w-full py-3 bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Upload & Verify PDF</span>
              </button>
            </form>
          )}

          {/* Demo Presets */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Test Demo Records:</span>
            <button
              type="button"
              onClick={() => handleDemoVerify("REG-2026-CS001")}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-medium rounded border border-slate-300"
            >
              REG-2026-CS001 (Valid)
            </button>
            <button
              type="button"
              onClick={() => handleDemoVerify("REG-TAMPER-TEST")}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-mono font-medium rounded border border-rose-200"
            >
              REG-TAMPER-TEST (Tamper Demo)
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Display Card */}
      {verificationResult && (
        <div className="max-w-3xl mx-auto space-y-6">
          {verificationResult.valid ? (
            /* SUCCESS CARD */
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden">
              <div className="bg-emerald-600 text-white p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">✓ Certificate Verified Authentic</h2>
                  <p className="text-emerald-100 text-sm">
                    Cryptographic leaf proof matches Ethereum Smart Contract Merkle Root.
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Academic Metadata Grid */}
                <div className="grid sm:grid-cols-2 gap-6 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Student Name</span>
                    <span className="text-lg font-bold text-slate-900">{verificationResult.verification.studentName}</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Registration Number</span>
                    <span className="text-lg font-mono font-bold text-brand-700">{verificationResult.verification.registrationNumber}</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Programme / Degree</span>
                    <span className="text-sm font-semibold text-slate-800">{verificationResult.verification.programme}</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Semester & Grade</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {verificationResult.verification.semester} (Grade: {verificationResult.verification.grade})
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Awarding Institution</span>
                    <span className="text-sm font-semibold text-slate-800">{verificationResult.verification.institution.name} ({verificationResult.verification.institution.code})</span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Date of Issue</span>
                    <span className="text-sm font-semibold text-slate-800">{verificationResult.verification.issueDate}</span>
                  </div>
                </div>

                {/* Cryptographic & Blockchain Proof Breakdown */}
                <div className="p-6 bg-slate-900 text-white rounded-xl space-y-4 font-mono text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-sans">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                    <span>Cryptographic & On-Chain Audit Proof</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <span className="text-slate-400 block">SHA-256 Leaf Hash:</span>
                      <span className="text-emerald-300 break-all">{verificationResult.verification.leafHash}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">Ethereum Merkle Root:</span>
                      <span className="text-brand-300 break-all">{verificationResult.verification.merkleRoot}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Batch ID:</span>
                        <span className="text-white font-semibold">{verificationResult.verification.batchId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">IPFS CID:</span>
                        <span className="text-teal-300 break-all">{verificationResult.verification.ipfsCid}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1">Ethereum Transaction Hash:</span>
                      <a
                        href={`http://127.0.0.1:8545`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 break-all"
                      >
                        <span>{verificationResult.verification.blockchainTxHash}</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* INVALID / TAMPERED CARD */
            <div className="bg-white rounded-2xl border-2 border-rose-500 shadow-xl overflow-hidden">
              <div className="bg-rose-600 text-white p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">✕ Certificate Could Not Be Verified</h2>
                  <p className="text-rose-100 text-sm">
                    The requested certificate failed cryptographic or on-chain verification.
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="font-bold text-rose-800 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Reason: {verificationResult.code || "VERIFICATION_FAILED"}</span>
                  </div>
                  <p className="text-slate-700 text-sm">{verificationResult.message}</p>
                </div>

                <p className="text-xs text-slate-500">
                  If you believe this is an error, please verify that the student registration number was entered correctly or contact the issuing university registrar.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
