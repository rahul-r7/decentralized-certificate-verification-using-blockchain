import React, { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";

export default function StaffDashboard() {
  const [batches, setBatches] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBatches = async () => {
    try {
      const res = await api.get("/batches");
      setBatches(res.batches || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setReport(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post("/batches/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setSelectedFile(null);
        fetchBatches();
      }
    } catch (err) {
      if (err.data && err.data.report) {
        setReport(err.data.report);
      }
      setErrorMsg(err.message || "CSV processing failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Examination Staff Dashboard</h1>
        <p className="text-sm text-slate-500">Upload student academic CSV datasets, generate certificates, and construct Merkle Trees</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* CSV Upload Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Upload className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-lg text-slate-900">Upload Student CSV</h3>
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Batch Created Successfully!</span>
              </div>
              <p>{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Validation Failure</span>
              </div>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Validation Error Report */}
          {report && (
            <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2 font-mono">
              <div className="font-bold text-amber-400 font-sans">Validation Report:</div>
              <div>Total Records: {report.totalRecords}</div>
              <div className="text-emerald-400">Valid Records: {report.validCount}</div>
              <div className="text-rose-400">Invalid Records: {report.invalidCount}</div>

              {report.invalidRecords && report.invalidRecords.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1 max-h-40 overflow-y-auto">
                  {report.invalidRecords.map((item, idx) => (
                    <div key={idx} className="text-rose-300">
                      Row #{item.rowNum}: {item.errors.join(", ")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleCsvSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 border border-slate-300 rounded-xl p-2 bg-slate-50"
              />
            </div>

            <p className="text-xs text-slate-500">
              Required headers: <code className="bg-slate-100 text-slate-800 px-1 rounded">registrationNumber, studentName, programme</code> (semester, grade, issueDate optional)
            </p>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full py-3 bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing CSV & IPFS...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Generate Certificate Batch</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Batches List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900">Certificate Batches</h3>
            <button onClick={fetchBatches} className="text-xs font-semibold text-brand-700 hover:underline">
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Batch ID</th>
                  <th className="p-4">Certificates</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Merkle Root</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-900">{b.batchId}</div>
                      <div className="text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{b.totalCertificates} Students</td>
                    <td className="p-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500 max-w-[200px] truncate">
                      {b.merkleRoot}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
