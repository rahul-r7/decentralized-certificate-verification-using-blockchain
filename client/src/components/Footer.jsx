import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-auto text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-500" />
          <span className="text-slate-300 font-semibold">Decentralized Academic Certificate Verification Platform</span>
        </div>
        <div className="text-slate-500">
          Powered by SHA-256 Merkle Trees, IPFS, EIP-712 Multi-Signatory Approvals, & Ethereum Blockchain.
        </div>
      </div>
    </footer>
  );
}
