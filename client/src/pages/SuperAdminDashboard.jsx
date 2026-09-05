import React, { useState, useEffect } from "react";
import { Building2, Users, ShieldAlert, CheckCircle, XCircle, Plus, RefreshCw } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("INSTITUTIONS");
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "EXAMINATION_STAFF",
    institutionId: "",
    walletAddress: "",
  });
  const [userMsg, setUserMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [instRes, userRes, logRes] = await Promise.all([
        api.get("/institutions"),
        api.get("/users"),
        api.get("/audit-logs"),
      ]);
      setInstitutions(instRes.institutions || []);
      setUsers(userRes.users || []);
      setAuditLogs(logRes.logs || []);
    } catch (err) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveInst = async (id) => {
    try {
      await api.patch(`/institutions/${id}/approve`);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectInst = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await api.patch(`/institutions/${id}/reject`, { rejectionReason: reason });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserMsg("");
    try {
      const res = await api.post("/users", newUser);
      if (res.success) {
        setUserMsg("User created successfully!");
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "EXAMINATION_STAFF",
          institutionId: "",
          walletAddress: "",
        });
        fetchData();
      }
    } catch (err) {
      setUserMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Super Administrator Dashboard</h1>
          <p className="text-sm text-slate-500">Manage university onboardings, authorized roles, and system audit logs</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition flex items-center gap-2 border border-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Institutions</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{institutions.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Onboardings</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            {institutions.filter((i) => i.status === "PENDING").length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Staff Users</div>
          <div className="text-3xl font-extrabold text-brand-600 mt-2">{users.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Log Actions</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{auditLogs.length}</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 border">
        <button
          onClick={() => setActiveTab("INSTITUTIONS")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
            activeTab === "INSTITUTIONS" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Institutions ({institutions.length})
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
            activeTab === "USERS" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          User Accounts ({users.length})
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

      {/* Tab Content */}
      {activeTab === "INSTITUTIONS" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-900">University Onboarding Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Institution Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Email / Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutions.map((inst) => (
                  <tr key={inst._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{inst.name}</td>
                    <td className="p-4 font-mono text-brand-700 font-semibold">{inst.code}</td>
                    <td className="p-4 text-slate-600">{inst.email}</td>
                    <td className="p-4">
                      <StatusBadge status={inst.status} />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {inst.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApproveInst(inst._id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectInst(inst._id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "USERS" && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Registered Staff & Approvers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Institution</th>
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
                      <td className="p-4 text-slate-600 text-xs">{u.institutionId ? u.institutionId.name : "N/A"}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {u.walletAddress ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}` : "Not Linked"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create User Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">Create Authorized User</h3>

            {userMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${userMsg.startsWith("Error") ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                {userMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="EXAMINATION_STAFF">EXAMINATION_STAFF</option>
                  <option value="CONTROLLER_OF_EXAMINATIONS">CONTROLLER_OF_EXAMINATIONS</option>
                  <option value="REGISTRAR">REGISTRAR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution</label>
                <select
                  value={newUser.institutionId}
                  onChange={(e) => setNewUser({ ...newUser, institutionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="">Select Institution</option>
                  {institutions.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">MetaMask Wallet Address (Optional)</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newUser.walletAddress}
                  onChange={(e) => setNewUser({ ...newUser, walletAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition shadow-md mt-2"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "AUDIT" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-900">Immutable System Audit Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">IP Address</th>
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
                    <td className="p-4 text-xs font-mono text-slate-400">{log.ipAddress || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
