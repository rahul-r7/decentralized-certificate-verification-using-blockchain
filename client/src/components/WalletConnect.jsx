import React, { useState } from "react";
import { Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { connectWallet } from "../services/web3";

export default function WalletConnect({ onWalletConnected, currentWallet }) {
  const [wallet, setWallet] = useState(currentWallet || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await connectWallet();
      setWallet(res.address);
      if (onWalletConnected) {
        onWalletConnected(res.address);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {wallet ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>
            {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}
          </span>
          <span className="text-xs bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
            Chain 31337
          </span>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium disabled:opacity-50"
        >
          <Wallet className="w-4 h-4" />
          {loading ? "Connecting..." : "Connect MetaMask"}
        </button>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1 text-xs text-rose-600">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
