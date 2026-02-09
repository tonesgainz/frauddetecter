"use client";

import { useState, useCallback, useMemo } from "react";
import { Transaction, ReviewDecision, TRANSACTIONS } from "@/data/transactions";
import TopBar from "@/components/TopBar";
import NetworkGraph from "@/components/NetworkGraph";
import ReviewQueue from "@/components/ReviewQueue";
import ChatPanel from "@/components/ChatPanel";

export default function Dashboard() {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, ReviewDecision>>({});
  const [queueFilter, setQueueFilter] = useState<"all" | "FAIL" | "UNCERTAIN">("all");
  const [chatOpen, setChatOpen] = useState(true);

  const handleSelectTx = useCallback((tx: Transaction) => {
    setSelectedTx((prev) => (prev?.id === tx.id ? null : tx));
  }, []);

  const handleSelectTxById = useCallback((txId: string) => {
    const tx = TRANSACTIONS.find((t) => t.id === txId);
    if (tx) setSelectedTx((prev) => (prev?.id === tx.id ? null : tx));
  }, []);

  const handleReview = useCallback((txId: string, decision: ReviewDecision) => {
    setReviewed((prev) => ({ ...prev, [txId]: decision }));
    setSelectedTx(null);
  }, []);

  const pendingTransactions = useMemo(
    () => TRANSACTIONS.filter((t) => !reviewed[t.id]),
    [reviewed]
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface">
      <TopBar
        transactions={TRANSACTIONS}
        reviewed={reviewed}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((o) => !o)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Review Queue with inline evidence drawer */}
        <div className="w-[380px] flex-shrink-0 bg-white border-r border-gray-200">
          <ReviewQueue
            transactions={TRANSACTIONS}
            selectedTxId={selectedTx?.id ?? null}
            onSelectTx={handleSelectTx}
            reviewed={reviewed}
            onReview={handleReview}
            filter={queueFilter}
            setFilter={setQueueFilter}
          />
        </div>

        {/* Center: Graph only */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface-muted">
          <div className="flex-1 relative">
            <NetworkGraph
              transactions={pendingTransactions}
              selectedTxId={selectedTx?.id ?? null}
              onSelectTx={handleSelectTx}
            />
            <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-gray-500 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 shadow-card pointer-events-none select-none">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-danger" />
                Fail
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning" />
                Uncertain
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                Node
              </span>
            </div>
          </div>
        </div>

        {/* Right: Chat */}
        <div
          className="flex-shrink-0 overflow-hidden bg-white border-l border-gray-200 panel-width-transition"
          style={{ width: chatOpen ? 380 : 0 }}
        >
          <div className="w-[380px] h-full">
            <ChatPanel onSelectTx={handleSelectTxById} />
          </div>
        </div>
      </div>
    </div>
  );
}
