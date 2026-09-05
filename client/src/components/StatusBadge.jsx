import React from "react";

export default function StatusBadge({ status }) {
  let colorStyle = "bg-slate-100 text-slate-700 border-slate-300";
  let label = status;

  switch (status) {
    case "PENDING":
    case "PENDING_COE_APPROVAL":
    case "PENDING_REGISTRAR_APPROVAL":
      colorStyle = "bg-amber-50 text-amber-700 border-amber-300";
      label = status === "PENDING" ? "Pending" : status === "PENDING_COE_APPROVAL" ? "Awaiting CoE Approval" : "Awaiting Registrar Approval";
      break;

    case "APPROVED":
    case "COE_APPROVED":
    case "FULLY_APPROVED":
      colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-300";
      label = status === "APPROVED" ? "Approved" : status === "COE_APPROVED" ? "CoE Approved" : "Fully Approved";
      break;

    case "BLOCKCHAIN_PENDING":
      colorStyle = "bg-blue-50 text-blue-700 border-blue-300 animate-pulse";
      label = "Blockchain Pending...";
      break;

    case "BLOCKCHAIN_CONFIRMED":
    case "VALID":
      colorStyle = "bg-emerald-100 text-emerald-800 border-emerald-400 font-semibold";
      label = status === "VALID" ? "✓ Valid Certificate" : "✓ Blockchain Confirmed";
      break;

    case "REJECTED":
    case "INVALID":
    case "FAILED":
      colorStyle = "bg-rose-50 text-rose-700 border-rose-300";
      label = status === "REJECTED" ? "Rejected" : status === "FAILED" ? "Failed" : "✕ Invalid";
      break;

    case "TAMPERED":
      colorStyle = "bg-rose-100 text-rose-800 border-rose-400 font-semibold";
      label = "✕ Tampered Record";
      break;

    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyle}`}>
      {label}
    </span>
  );
}
