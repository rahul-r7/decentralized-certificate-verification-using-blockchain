import React, { useState, useEffect } from "react";
import { ShieldCheck, Eye, XCircle, CheckCircle } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import ApprovalModal from "../components/ApprovalModal";
import api from "../services/api";

export default function CoeDashboard() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/batches");
      setBatches(res.batches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleOpenApproveModal = (batch) => {
    setSelectedBatch(batch);
    setIsModalOpen(true);
  };

  const handleReject = async (batchId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await api.post(`/batches/${batchId}/reject`, { rejectionReason: reason });
      fetchBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingBatches = batches.filter((b) => b.status === "PENDING_COE_APPROVAL");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Controller of Examinations (CoE) Portal</h1>
          <p className="text-sm text-slate-500">First-level cryptographic EIP-712 approval authority</p>
        </div>
        <button
          onClick={fetchBatches}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl border border-slate-300 transition"
        >
          Refresh Batches
        </button>
      </div>

      {/* Pending Batches Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">Batches Awaiting CoE Signature</h3>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
            {pendingBatches.length} Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Batch ID</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">Certificates</th>
                <th className="p-4">Merkle Root</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingBatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    No batches pending CoE approval.
                  </td>
                </tr>
              ) : (
                pendingBatches.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-slate-900">{b.batchId}</td>
                    <td className="p-4 text-slate-700 font-medium">
                      {b.uploadedBy ? b.uploadedBy.name : "Staff"}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{b.totalCertificates} Students</td>
                    <td className="p-4 font-mono text-xs text-slate-500 max-w-[200px] truncate">
                      {b.merkleRoot}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenApproveModal(b)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Sign Approval
                      </button>
                      <button
                        onClick={() => handleReject(b.batchId)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Batches */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">All Institution Batches History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Batch ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Blockchain Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-slate-900">{b.batchId}</td>
                  <td className="p-4 text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {b.blockchainTxHash ? `${b.blockchainTxHash.slice(0, 10)}...` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EIP-712 Approval Modal */}
      <ApprovalModal
        batch={selectedBatch}
        userRole="CONTROLLER_OF_EXAMINATIONS"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBatches}
      />
    </div>
  );
}
