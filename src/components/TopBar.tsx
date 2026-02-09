"use client";

import { Transaction, ReviewDecision } from "@/data/transactions";
import { BarChart3, PanelRightClose, PanelRightOpen } from "lucide-react";

interface Props {
  transactions: Transaction[];
  reviewed: Record<string, ReviewDecision>;
  chatOpen: boolean;
  onToggleChat: () => void;
}

export default function TopBar({
  transactions,
  reviewed,
  chatOpen,
  onToggleChat,
}: Props) {
  const pending = transactions.filter((t) => !reviewed[t.id]);
  const failCount = pending.filter((t) => t.status === "FAIL").length;
  const uncertainCount = pending.filter((t) => t.status === "UNCERTAIN").length;
  const reviewedCount = Object.keys(reviewed).length;

  return (
    <header className="h-14 flex items-center px-5 gap-4 flex-shrink-0 bg-white border-b border-gray-200">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">Fraud Analyzer</span>
        <span className="text-2xs text-gray-400 hidden sm:inline">SNF</span>
      </div>

      <div className="flex-1" />

      {/* Status counts */}
      <div className="flex items-center gap-5 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-gray-500">Fail</span>
          <span className="font-semibold text-gray-900">{failCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-gray-500">Uncertain</span>
          <span className="font-semibold text-gray-900">{uncertainCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-gray-500">Reviewed</span>
          <span className="font-semibold text-gray-900">{reviewedCount}</span>
        </div>
      </div>

      {/* Chat toggle */}
      <button
        onClick={onToggleChat}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label={chatOpen ? "Hide assistant" : "Show assistant"}
      >
        {chatOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
      </button>
    </header>
  );
}
