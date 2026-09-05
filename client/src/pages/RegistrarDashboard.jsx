import React, { useState, useEffect } from "react";
import { ShieldCheck, Cpu, UserPlus, Users, Activity } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import ApprovalModal from "../components/ApprovalModal";
import api from "../services/api";

export default function RegistrarDashboard() {
  const [activeTab, setActiveTab] = useState("APPROVALS"); // "APPROVALS", "USERS", "AUDIT"
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Staff Form State
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
    role: "EXAMINATION_STAFF",
    walletAddress: "",
  });
  const [staffMsg, setStaffMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchRes, userRes, logRes] = await Promise.all([
        api.get("/batches"),
        api.get("/users"),
        api.get("/audit-logs"),
      ]);
      setBatches(batchRes.batches || []);
      setUsers(userRes.users || []);
      setAuditLogs(logRes.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffMsg("");
    try {
      const res = await api.post("/users", newStaff);
      if (res.success) {
        setStaffMsg("Staff account created successfully!");
        setNewStaff({
          name: "",
          email: "",
          password: "",
          role: "EXAMINATION_STAFF",
          walletAddress: "",
        });
        fetchData();
      }
    } catch (err) {
      setStaffMsg(`Error: ${err.message}`);
    }
  };

  const pendingBatches = batches.filter((b) => b.status === "PENDING_REGISTRAR_APPROVAL");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Registrar Portal</h1>
          <p className="text-sm text-slate-500">
            Final EIP-712 approval authority. Manage university staff accounts & trigger on-chain Ethereum Merkle Root registration.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl border border-slate-300 transition"
        >
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 border">
        <button
          onClick={() => setActiveTab("APPROVALS")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
            activeTab === "APPROVALS" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Pending Approvals ({pendingBatches.length})
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
            activeTab === "USERS" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Manage Staff Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
            activeTab === "AUDIT" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Audit Activity ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Approvals */}
      {activeTab === "APPROVALS" && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Batches Awaiting Final Registrar Signature & Blockchain Commit</h3>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {pendingBatches.length} Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Batch ID</th>
                    <th className="p-4">Certificates</th>
                    <th className="p-4">CoE Status</th>
                    <th className="p-4">Merkle Root</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                        No batches awaiting Registrar approval.
                      </td>
                    </tr>
                  ) : (
                    pendingBatches.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-900">{b.batchId}</td>
                        <td className="p-4 font-semibold text-slate-800">{b.totalCertificates} Students</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ CoE Signed
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-500 max-w-[200px] truncate">
                          {b.merkleRoot}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenApproveModal(b)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            Sign & Commit to Blockchain
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
                    <th className="p-4">Blockchain Tx Hash</th>
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
                      <td className="p-4 font-mono text-xs text-emerald-700 font-semibold break-all">
                        {b.blockchainTxHash || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Staff */}
      {activeTab === "USERS" && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">University Staff & Approvers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Name / Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Wallet Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-4 font-semibold text-brand-700 text-xs">
                        {u.role.replace(/_/g, " ")}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {u.walletAddress ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}` : "Not Linked"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Create Staff Account</h3>

            {staffMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${staffMsg.startsWith("Error") ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                {staffMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. A. Sharma"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="staff@university.edu"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="EXAMINATION_STAFF">EXAMINATION_STAFF</option>
                  <option value="CONTROLLER_OF_EXAMINATIONS">CONTROLLER_OF_EXAMINATIONS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">MetaMask Wallet Address (Optional)</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newStaff.walletAddress}
                  onChange={(e) => setNewStaff({ ...newStaff, walletAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-md mt-2"
              >
                Create Staff Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Activity */}
      {activeTab === "AUDIT" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-900">Institution Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-brand-700 text-xs">{log.action}</td>
                    <td className="p-4 text-xs font-medium text-slate-900">
                      {log.userId ? log.userId.email : "System / Guest"}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-600">{log.entityType} ({log.entityId})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EIP-712 Approval Modal */}
      <ApprovalModal
        batch={selectedBatch}
        userRole="REGISTRAR"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
