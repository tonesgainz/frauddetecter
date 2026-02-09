"use client";

import { useRef, useEffect } from "react";
import { Transaction, ReviewDecision } from "@/data/transactions";
import { statusColor, statusBg, formatAmount, timeAgo, confidenceLabel } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type QueueFilter = "all" | "FAIL" | "UNCERTAIN";

const riskBorderColors = ["#dc2626", "#ea580c", "#ea580c", "#059669", "#059669", "#6b7280"];

interface Props {
  transactions: Transaction[];
  selectedTxId: string | null;
  onSelectTx: (tx: Transaction) => void;
  reviewed: Record<string, ReviewDecision>;
  onReview: (txId: string, decision: ReviewDecision) => void;
  filter: QueueFilter;
  setFilter: (f: QueueFilter) => void;
}

export default function ReviewQueue({
  transactions,
  selectedTxId,
  onSelectTx,
  reviewed,
  onReview,
  filter,
  setFilter,
}: Props) {
  const pending = transactions.filter((t) => !reviewed[t.id]);
  const filtered = pending.filter((t) => filter === "all" || t.status === filter);
  const reviewedList = Object.entries(reviewed);
  const selectedCardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected card
  useEffect(() => {
    if (selectedTxId && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedTxId]);

  const filterOptions: Array<{ key: QueueFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: pending.length },
    { key: "FAIL", label: "Fail", count: pending.filter((t) => t.status === "FAIL").length },
    { key: "UNCERTAIN", label: "Uncertain", count: pending.filter((t) => t.status === "UNCERTAIN").length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Review Queue</h2>
        <div className="flex gap-1.5">
          {filterOptions.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-md text-2xs font-medium transition-colors border ${
                filter === key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {filtered.map((tx) => {
          const isSelected = selectedTxId === tx.id;
          const isReviewed = !!reviewed[tx.id];

          return (
            <div
              key={tx.id}
              ref={isSelected ? selectedCardRef : undefined}
              className={`rounded-lg transition-all border bg-white overflow-hidden ${
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-gray-200 hover:shadow-card"
              }`}
            >
              {/* Card header (always visible, clickable) */}
              <div
                onClick={() => onSelectTx(tx)}
                className="p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-2xs font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: statusBg(tx.status), color: statusColor(tx.status) }}
                  >
                    {tx.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{tx.id}</span>
                  <span className="flex-1" />
                  <span className="text-sm font-semibold text-gray-900">
                    {formatAmount(tx.amount, tx.currency)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                      isSelected ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <div className="flex gap-3 text-2xs text-gray-500 flex-wrap mb-1.5">
                  <span>{tx.merchant}</span>
                  <span>{tx.location}</span>
                  <span>{(tx.confidence * 100).toFixed(0)}%</span>
                  <span>{timeAgo(tx.timestamp)}</span>
                </div>
                <div
                  className="text-2xs text-gray-600 pl-2.5 border-l-2 truncate"
                  style={{ borderColor: statusColor(tx.status) }}
                >
                  {tx.riskFactors[0]}
                </div>
              </div>

              {/* Inline evidence drawer (expands when selected) */}
              {isSelected && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-3 pb-3 pt-2 animate-slide-up">
                  {/* Confidence bar */}
                  <div className="mb-3">
                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${tx.confidence * 100}%`,
                          background: statusColor(tx.status),
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-2xs text-gray-400">
                      <span>Fail</span>
                      <span>{confidenceLabel(tx.confidence)}</span>
                      <span>Pass</span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    {([
                      ["Card", tx.card],
                      ["MCC", tx.mcc],
                      ["Channel", tx.channel],
                      ["Device", tx.device],
                      ["IP", tx.ip],
                      ["Community", tx.graphCommunity],
                    ] as const).map(([label, val]) => (
                      <div key={label}>
                        <div className="text-2xs text-gray-400 uppercase tracking-wider">{label}</div>
                        <div className="text-2xs text-gray-900 truncate">{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Risk factors */}
                  <div className="mb-3">
                    <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Risk factors
                    </div>
                    <div className="space-y-1">
                      {tx.riskFactors.map((rf, i) => (
                        <div
                          key={i}
                          className="text-2xs text-gray-700 py-1.5 pl-2.5 pr-2 rounded bg-white border-l-2"
                          style={{ borderColor: riskBorderColors[i] ?? "#9ca3af" }}
                        >
                          {rf}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-3 text-2xs text-gray-500 mb-3 flex-wrap">
                    <span>Related: <span className="text-gray-900 font-medium">{tx.relatedCards}</span></span>
                    <span>Similar: <span className="text-gray-900 font-medium">{tx.similarCases}</span></span>
                    <span>
                      Fraud rate:{" "}
                      <span
                        className="font-medium"
                        style={{ color: tx.similarFraudRate > 0.5 ? "#dc2626" : "#ea580c" }}
                      >
                        {(tx.similarFraudRate * 100).toFixed(0)}%
                      </span>
                    </span>
                  </div>

                  {/* Action buttons */}
                  {!isReviewed ? (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onReview(tx.id, "approved"); }}
                        className="flex-1 py-2 rounded-lg font-semibold text-2xs bg-success text-white hover:bg-emerald-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onReview(tx.id, "declined"); }}
                        className="flex-1 py-2 rounded-lg font-semibold text-2xs border border-danger text-danger hover:bg-red-50 transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onReview(tx.id, "escalated"); }}
                        className="flex-1 py-2 rounded-lg font-semibold text-2xs border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Escalate
                      </button>
                    </div>
                  ) : (
                    <div className="py-2 px-3 rounded-lg bg-success-muted border border-success/20 text-success font-medium text-2xs">
                      Reviewed as {reviewed[tx.id].toUpperCase()} — sent to RLHF pipeline
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-12">
            {pending.length === 0
              ? "All transactions reviewed"
              : `No ${filter.toLowerCase()} transactions`}
          </div>
        )}

        {/* Reviewed section */}
        {reviewedList.length > 0 && (
          <div className="pt-4 mt-2 border-t border-gray-200">
            <h3 className="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Reviewed ({reviewedList.length})
            </h3>
            <div className="space-y-1.5">
              {reviewedList.map(([txId, decision]) => {
                const tx = transactions.find((t) => t.id === txId);
                if (!tx) return null;
                const decColor =
                  decision === "approved" ? "text-success" : decision === "declined" ? "text-danger" : "text-warning";
                return (
                  <div
                    key={txId}
                    className="p-2.5 rounded-lg flex items-center gap-2 bg-gray-50 border border-gray-100"
                  >
                    <span className={`text-2xs font-semibold uppercase ${decColor}`}>
                      {decision}
                    </span>
                    <span className="text-sm text-gray-700">{txId}</span>
                    <span className="flex-1" />
                    <span className="text-sm text-gray-500">
                      {formatAmount(tx.amount, tx.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
