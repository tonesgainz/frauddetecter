import { TransactionStatus } from "@/data/transactions";

// Enterprise: muted pastel status colors
export function statusColor(status: TransactionStatus): string {
  switch (status) {
    case "FAIL":
      return "#dc2626";
    case "UNCERTAIN":
      return "#ea580c";
    case "PASS":
      return "#059669";
  }
}

export function statusBg(status: TransactionStatus): string {
  switch (status) {
    case "FAIL":
      return "#fecaca";
    case "UNCERTAIN":
      return "#ffedd5";
    case "PASS":
      return "#d1fae5";
  }
}

export function confidenceLabel(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}

export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    GBP: "£",
    EUR: "€",
  };
  return `${symbols[currency] || ""}${amount.toLocaleString()}`;
}

export function renderFormattedText(text: string): Array<{ type: "text" | "bold"; content: string }> {
  const parts: Array<{ type: "text" | "bold"; content: string }> = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "bold", content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  return parts;
}
