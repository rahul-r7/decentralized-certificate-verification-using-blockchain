import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  X,
  FileText,
  ShieldCheck,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Hash,
  Award,
  Calendar,
  BookOpen,
  Eye,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import api from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function BatchStudentsModal({
  batch,
  isOpen,
  onClose,
  onOpenApprove,
  onReject,
  userRole,
}) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [previewPdfRegNo, setPreviewPdfRegNo] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    if (!isOpen || !batch) {
      setCertificates([]);
      setError("");
      setSearchQuery("");
      setSelectedStudent(null);
      setPreviewPdfRegNo(null);
      return;
    }

    const fetchBatchCertificates = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/batches/${batch.batchId}`);
        if (res.success) {
          setCertificates(res.certificates || []);
        } else {
          setError(res.message || "Failed to load student certificates for this batch.");
        }
      } catch (err) {
        console.error("Error fetching batch certificates:", err);
        setError(err.message || "Network error loading student details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBatchCertificates();
  }, [isOpen, batch]);

  if (!isOpen || !batch) return null;

  const token = localStorage.getItem("token") || "";

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredCertificates = certificates.filter((cert) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (cert.studentName || "").toLowerCase();
    const regNo = (cert.registrationNumber || "").toLowerCase();
    const prog = (cert.programme || "").toLowerCase();
    const sem = (cert.semester || "").toLowerCase();
    const grade = (cert.academicData?.grade || "").toLowerCase();
    return (
      name.includes(q) ||
      regNo.includes(q) ||
      prog.includes(q) ||
      sem.includes(q) ||
      grade.includes(q)
    );
  });

  const isBatchPendingForRole =
    (userRole === "CONTROLLER_OF_EXAMINATIONS" && batch.status === "PENDING_COE_APPROVAL") ||
    (userRole === "REGISTRAR" && batch.status === "PENDING_REGISTRAR_APPROVAL");

  const getGradeBadgeColor = (grade) => {
    if (!grade) return "bg-slate-100 text-slate-700 border-slate-200";
    const g = String(grade).toUpperCase();
    if (g.startsWith("A") || g.includes("DISTINCTION") || g.includes("FIRST") || parseFloat(g) >= 8.5) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold";
    }
    if (g.startsWith("B") || parseFloat(g) >= 7.0) {
      return "bg-blue-50 text-blue-800 border-blue-200 font-semibold";
    }
    if (g.startsWith("C") || parseFloat(g) >= 5.5) {
      return "bg-amber-50 text-amber-800 border-amber-200 font-semibold";
    }
    return "bg-slate-50 text-slate-800 border-slate-200 font-semibold";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">
                  Student Verification Roster
                </h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {batch.batchId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verify student academic credentials prior to EIP-712 approval authority endorsement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Overview Meta Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Batch Status</span>
            <div className="mt-1">
              <StatusBadge status={batch.status} />
            </div>
          </div>

          <div>
            <span className="text-slate-500 block font-medium">Total Candidates</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">
              {batch.totalCertificates || certificates.length} Students
            </span>
          </div>

          <div>
            <span className="text-slate-500 block font-medium">Uploaded By</span>
            <span className="font-semibold text-slate-800 truncate block mt-0.5" title={batch.uploadedBy?.email}>
              {batch.uploadedBy?.name || "Examination Staff"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block font-medium">Merkle Root</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[130px]" title={batch.merkleRoot}>
                {batch.merkleRoot}
              </span>
              <button
                onClick={() => handleCopy(batch.merkleRoot, "root")}
                title="Copy Merkle Root"
                className="text-slate-400 hover:text-slate-700 transition"
              >
                {copiedHash === "root" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Authority Verification Reminder */}
        <div className="px-6 py-2.5 bg-brand-50/70 border-b border-brand-100 flex items-center justify-between text-xs text-brand-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>
              {userRole === "CONTROLLER_OF_EXAMINATIONS" ? (
                <>
                  <strong>CoE Verification Responsibility:</strong> Please audit student names, registration numbers, degrees, and grades against the university records before signing.
                </>
              ) : userRole === "REGISTRAR" ? (
                <>
                  <strong>Registrar Final Audit:</strong> Review all verified student records before authorizing on-chain Merkle Root registration on Ethereum.
                </>
              ) : (
                <>
                  <strong>Audit Roster:</strong> Viewing official student records compiled in this certificate batch.
                </>
              )}
            </span>
          </div>
          <span className="font-bold text-brand-700 bg-white px-2.5 py-0.5 rounded-full border border-brand-200">
            {certificates.length} Records Loaded
          </span>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, reg no, course, grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredCertificates.length}</strong> of{" "}
            <strong className="text-slate-800">{certificates.length}</strong> students
          </div>
        </div>

        {/* Content Body: Student Records Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Loading student certificates for verification...</p>
              <p className="text-xs text-slate-400">Fetching cryptographic proofs and academic metadata</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Error loading student details:</strong> {error}
              </div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No student certificate records found in this batch.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="p-3.5 pl-4">#</th>
                    <th className="p-3.5">Registration No</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Programme / Course</th>
                    <th className="p-3.5">Semester</th>
                    <th className="p-3.5">Grade</th>
                    <th className="p-3.5">Type & Date</th>
                    <th className="p-3.5">Leaf Hash</th>
                    <th className="p-3.5 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCertificates.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No students match search filter "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredCertificates.map((cert, index) => (
                      <tr
                        key={cert._id || cert.registrationNumber}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="p-3.5 pl-4 text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        <td className="p-3.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {cert.registrationNumber}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-xs">
                            {cert.studentName}
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-700 font-medium">
                          {cert.programme}
                        </td>

                        <td className="p-3.5 text-slate-600 font-medium">
                          {cert.semester ? `Semester ${cert.semester}` : "Full Degree"}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] border ${getGradeBadgeColor(
                              cert.academicData?.grade
                            )}`}
                          >
                            {cert.academicData?.grade || "N/A"}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600">
                          <div className="font-medium text-slate-800">
                            {cert.academicData?.certificateType || "Degree"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {cert.academicData?.issueDate || "N/A"}
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-[10px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <span
                              className="truncate max-w-[90px]"
                              title={cert.leafHash}
                            >
                              {cert.leafHash}
                            </span>
                            <button
                              onClick={() => handleCopy(cert.leafHash, cert.registrationNumber)}
                              title="Copy Leaf Hash"
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedHash === cert.registrationNumber ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="p-3.5 pr-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setPreviewPdfRegNo(cert.registrationNumber)}
                            className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold border border-brand-200 inline-flex items-center gap-1 transition"
                            title="Preview Certificate PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-600" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => setSelectedStudent(cert)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                            title="Inspect Canonical Data"
                          >
                            <Hash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              All student credentials cryptographically anchored in Merkle Root{" "}
              <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">
                {batch.merkleRoot?.slice(0, 14)}...
              </code>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition"
            >
              Close Roster
            </button>

            {isBatchPendingForRole && onReject && (
              <button
                onClick={() => {
                  onClose();
                  onReject(batch.batchId);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Batch
              </button>
            )}

            {isBatchPendingForRole && onOpenApprove && (
              <button
                onClick={() => {
                  onClose();
                  onOpenApprove(batch);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {userRole === "CONTROLLER_OF_EXAMINATIONS"
                  ? "Verified: Proceed to CoE Sign"
                  : "Verified: Proceed to Commit on Blockchain"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Certificate PDF Preview Sub-modal */}
      {previewPdfRegNo && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden border border-slate-300">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <h4 className="font-bold text-sm text-white">
                  Certificate Document Preview:{" "}
                  <span className="font-mono text-brand-300">{previewPdfRegNo}</span>
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`${API_BASE_URL}/certificates/preview/${encodeURIComponent(
                    previewPdfRegNo
                  )}?token=${encodeURIComponent(token)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </a>
                <button
                  onClick={() => setPreviewPdfRegNo(null)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-200">
              <iframe
                title="Certificate PDF Preview"
                src={`${API_BASE_URL}/certificates/preview/${encodeURIComponent(
                  previewPdfRegNo
                )}?token=${encodeURIComponent(token)}`}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Student Details & Canonical Data Inspector Sub-modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-600" />
                <h4 className="font-bold text-base text-slate-900">
                  Student Verification Profile
                </h4>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Registration Number:</span>
                  <span className="font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                    {selectedStudent.registrationNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Programme:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.programme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Semester:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.semester || "All Semesters"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Grade / CGPA:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {selectedStudent.academicData?.grade || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Issue Date:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.academicData?.issueDate || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Certificate Type:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.academicData?.certificateType || "Degree"}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-600 font-bold block mb-1">Normalized Canonical String:</span>
                <div className="p-2 bg-slate-900 text-slate-200 rounded font-mono text-[11px] break-all max-h-24 overflow-y-auto">
                  {selectedStudent.canonicalData}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  SHA-256 hashed from registrationNumber, studentName, programme, semester, grade, and institution.
                </p>
              </div>

              <div>
                <span className="text-slate-600 font-bold block mb-1">Leaf Hash (SHA-256):</span>
                <div className="p-2 bg-slate-900 text-emerald-400 rounded font-mono text-[11px] break-all">
                  {selectedStudent.leafHash}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setPreviewPdfRegNo(selectedStudent.registrationNumber);
                }}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                Preview PDF
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
