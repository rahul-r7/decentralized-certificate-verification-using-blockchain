import React, { useState } from "react";
import { ShieldCheck, X, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import WalletConnect from "./WalletConnect";
import { signBatchApproval } from "../services/web3";
import api from "../services/api";

export default function ApprovalModal({ batch, userRole, isOpen, onClose, onSuccess, onViewStudents }) {
  const [connectedWallet, setConnectedWallet] = useState("");
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [signedSuccess, setSignedSuccess] = useState(false);

  if (!isOpen || !batch) return null;

  const handleSignAndApprove = async () => {
    setSigning(true);
    setError("");
    try {
      if (!connectedWallet) {
        throw new Error("Please connect your MetaMask wallet first.");
      }

      const instCode = batch.institutionId?.code || "NIT-001";

      // 1. Trigger MetaMask EIP-712 signature modal prompt
      const signedData = await signBatchApproval({
        batchId: batch.batchId,
        institutionId: instCode,
        merkleRoot: batch.merkleRoot,
        role: userRole,
      });

      // 2. Submit signature to backend for validation and automated state transition
      const res = await api.post(`/batches/${batch.batchId}/signature`, {
        signature: signedData.signature,
        walletAddress: signedData.walletAddress,
        timestamp: signedData.timestamp,
      });

      if (res.success) {
        setSignedSuccess(true);
        setTimeout(() => {
          onSuccess(res);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Approval Modal Error:", err);
      setError(err.message || "Failed to complete signature approval.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="font-semibold text-lg">Cryptographic EIP-712 Approval</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {signedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-xl font-bold text-slate-800">Approval Successfully Recorded!</h4>
              <p className="text-sm text-slate-600">
                EIP-712 signature verified. {userRole === "REGISTRAR" ? "Committed to Ethereum Blockchain." : "Advanced to next authority."}
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Batch ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{batch.batchId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Certificates:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{batch.totalCertificates} Students</span>
                    {onViewStudents && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewStudents(batch);
                        }}
                        className="text-xs text-brand-600 hover:text-brand-800 font-bold underline flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Verify Students
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Approval Role:</span>
                  <span className="font-semibold text-brand-700">{userRole}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium block mb-1">Merkle Root:</span>
                  <div className="p-2 bg-slate-900 text-emerald-400 font-mono text-xs rounded break-all">
                    {batch.merkleRoot}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  1. Connect Approver MetaMask Wallet
                </label>
                <WalletConnect onWalletConnected={(addr) => setConnectedWallet(addr)} currentWallet={connectedWallet} />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignAndApprove}
                  disabled={!connectedWallet || signing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-md disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {signing ? "Prompting Signature..." : "Sign Approval with MetaMask"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
