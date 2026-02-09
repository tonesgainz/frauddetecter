import { Transaction, TRANSACTIONS } from "@/data/transactions";

interface ChatResponse {
  text: string;
  linkedTxId?: string;
}

const TX_RESPONSES: Record<string, string> = {
  "TX-9921002":
    "**TX-9921002** was flagged as **FAIL** (confidence: 18%) due to a severe geo-velocity violation. The card was used in London just 23 minutes before this $4,829 charge appeared in Lagos, Nigeria — that's physically impossible travel.\n\nCombined with a brand-new device fingerprint, a VPN-masked Nigerian IP, and an amount 12x above the cardholder's average, this matches the profile of a compromised card being tested at a high-value e-commerce merchant.\n\n**Recommendation:** Decline. 86% of similar cases in the last 90 days were confirmed fraud.",
  "TX-8829341":
    "**TX-8829341** is **UNCERTAIN** (confidence: 62%). The $1,247.50 charge at TechZone Direct is 3.2x the cardholder's 30-day average.\n\nThe merchant's elevated fraud rate (2.1% vs 0.3% category average) is the bigger concern. The time-of-day anomaly (3:38 AM local) could indicate account takeover, though some legitimate cardholders do shop late.\n\n**Recommendation:** Contact cardholder for verification before clearing. If cardholder confirms, approve and log as false positive for RLHF training.",
  "TX-7723091":
    "**TX-7723091** is **UNCERTAIN** (confidence: 71%). This £89.99 contactless tap at Prime Gadgets UK is relatively low-risk individually, but the card was used at 3 different merchants within 12 minutes — suggesting either a shopping spree or card testing.\n\nThe merchant was registered less than 30 days ago, which is a moderate risk signal.\n\n**Recommendation:** Low priority review. Likely legitimate but monitor for velocity escalation.",
  "TX-6612847":
    "**TX-6612847** is a high-confidence **FAIL** (confidence: 9%). This is a $12,750 purchase at LuxWatch Exchange in Bucharest — the largest transaction ever attempted on this card (previous max: $890).\n\n**Critical signals:**\n• Card was added to a new device just 4 minutes before the transaction\n• Shipping and billing addresses are in different countries\n• IP geolocation doesn't match the browser's reported timezone\n• 3 failed CVV attempts in the preceding hour\n\n**Recommendation:** Decline immediately. 94% of similar cases were confirmed fraud. This has all hallmarks of an account takeover with a stolen card number.",
  "TX-5501293":
    "**TX-5501293** is **UNCERTAIN** (confidence: 55%). This €340 charge at SportsDirect EU in Berlin is the cardholder's first cross-border transaction — they typically shop domestically in the US.\n\nThe device trust score is low (0.3/1.0) and the merchant shares a payment processor with 2 previously flagged merchants.\n\n**Recommendation:** Medium priority. Verify with cardholder. Could be legitimate travel.",
  "TX-4409182":
    "**TX-4409182** is a critical **FAIL** (confidence: 12%). The card was **reported stolen 2 hours ago** with an active issuer alert.\n\nThe $2,199 transaction from Kyiv is attempted from a sanctioned IP range, and the device fingerprint is linked to 4 other declined cards in Community C-0042 — this is part of the fraud ring we're tracking.\n\n**Recommendation:** Decline. Flag for law enforcement referral. Update C-0042 community risk score.",
  "TX-3318274":
    "**TX-3318274** is **UNCERTAIN** (confidence: 74%). This £67.50 purchase at CoffeeClub Online is the card's first-ever e-commerce transaction — all previous activity was POS-only.\n\nThe delivery postcode differs from the registered address, but only 12% of similar cases were fraud.\n\n**Recommendation:** Low priority. Likely a legitimate first online purchase. Auto-clear if no escalation within 30 minutes.",
};

export function generateChatResponse(message: string): ChatResponse {
  const msg = message.toLowerCase();

  // Check for specific transaction ID
  const txMatch = TRANSACTIONS.find((tx) =>
    msg.includes(tx.id.toLowerCase())
  );
  if (txMatch) {
    return {
      text:
        TX_RESPONSES[txMatch.id] ||
        `**${txMatch.id}** is classified as **${txMatch.status}** with ${(txMatch.confidence * 100).toFixed(0)}% confidence. Key risk factors: ${txMatch.riskFactors.slice(0, 2).join("; ")}. Select it in the review queue for full evidence.`,
      linkedTxId: txMatch.id,
    };
  }

  // FAIL transactions
  if (msg.includes("fail") || msg.includes("blocked") || msg.includes("declined")) {
    const fails = TRANSACTIONS.filter((t) => t.status === "FAIL");
    return {
      text: `There are currently **${fails.length} FAIL** transactions in the queue:\n\n${fails.map((t) => `• **${t.id}** — $${t.amount.toLocaleString()} at ${t.merchant} (confidence: ${(t.confidence * 100).toFixed(0)}%)`).join("\n")}\n\nClick any transaction ID above, or select one from the queue to see full evidence and review.`,
    };
  }

  // UNCERTAIN transactions
  if (msg.includes("uncertain") || msg.includes("pending") || msg.includes("review")) {
    const uncertain = TRANSACTIONS.filter((t) => t.status === "UNCERTAIN");
    return {
      text: `There are **${uncertain.length} UNCERTAIN** transactions awaiting review:\n\n${uncertain.map((t) => `• **${t.id}** — $${t.amount.toLocaleString()} at ${t.merchant} (confidence: ${(t.confidence * 100).toFixed(0)}%)`).join("\n")}\n\nI'd recommend starting with the lowest confidence scores first. Want me to analyze any of these?`,
    };
  }

  // Community / pattern analysis
  if (msg.includes("community") || msg.includes("pattern") || msg.includes("ring") || msg.includes("c-0042")) {
    return {
      text: '**Community C-0042** shows the highest fraud concentration right now. Three FAIL transactions (TX-9921002, TX-6612847, TX-4409182) are clustered in this community.\n\n**Pattern identified:** All three involve high-value e-commerce from unusual geolocations with new or compromised device fingerprints. TX-4409182\'s device is directly linked to 4 other declined cards in the same cluster.\n\nThis appears to be a **coordinated fraud ring** operating across Lagos, Bucharest, and Kyiv. The shared device fingerprints suggest a single threat actor or group.\n\n**Recommendation:** Flag all cards in C-0042 for enhanced monitoring. Consider bulk-declining pending UNCERTAIN transactions from this community.',
    };
  }

  // Statistics
  if (msg.includes("stats") || msg.includes("summary") || msg.includes("overview") || msg.includes("how many")) {
    const fails = TRANSACTIONS.filter((t) => t.status === "FAIL").length;
    const uncertain = TRANSACTIONS.filter((t) => t.status === "UNCERTAIN").length;
    const totalAmount = TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0);
    const avgConfidence = TRANSACTIONS.reduce((sum, t) => sum + t.confidence, 0) / TRANSACTIONS.length;
    return {
      text: `**Queue Summary:**\n\n• **${TRANSACTIONS.length}** total flagged transactions\n• **${fails}** FAIL / **${uncertain}** UNCERTAIN\n• Total flagged amount: **$${totalAmount.toLocaleString()}**\n• Average model confidence: **${(avgConfidence * 100).toFixed(0)}%**\n• Highest risk: **TX-6612847** ($12,750 — 9% confidence)\n• Active communities: **4** (C-0007, C-0018, C-0031, C-0042)\n• C-0042 has the most activity with **3 FAIL** transactions`,
    };
  }

  // Explain / why
  if (msg.includes("explain") || msg.includes("why") || msg.includes("how does")) {
    return {
      text: "The fraud detection model uses a **multi-modal ensemble** of four sub-networks:\n\n• **Tabular Network** — analyzes 120+ engineered features like transaction velocity, amount deviation, and merchant risk scores\n• **Graph Neural Network** — detects structural patterns in the transaction network (fraud rings, shared devices, suspicious bridges between communities)\n• **Sequence Model** — learns each cardholder's spending behavior and flags deviations from their baseline\n• **Vision Model** — processes merchant images and receipt scans when available\n\nThe four outputs are fused via cross-attention and produce a confidence score (0-100%). Transactions scoring below 40% are **FAIL**, 40-84% are **UNCERTAIN**, and 85%+ are **PASS**.\n\nEvery human review decision feeds back into the RLHF pipeline to improve the model. Ask me about a specific transaction to see which factors drove its score.",
    };
  }

  // Card lookup
  if (msg.includes("card") && (msg.includes("4521") || msg.includes("8832") || msg.includes("3309"))) {
    const cardNum = msg.includes("4521") ? "4521" : msg.includes("8832") ? "8832" : "3309";
    const cardTxs = TRANSACTIONS.filter((t) => t.card.includes(cardNum));
    return {
      text: `**Card ending ${cardNum}** has **${cardTxs.length}** flagged transaction(s):\n\n${cardTxs.map((t) => `• **${t.id}** — ${t.status} — $${t.amount.toLocaleString()} at ${t.merchant}`).join("\n")}\n\nWant me to check for device sharing or network connections for this card?`,
    };
  }

  // Default
  return {
    text: "I can help you investigate flagged transactions. Try asking:\n\n• **\"Show FAIL transactions\"** — see all blocked transactions\n• **\"Tell me about TX-9921002\"** — deep dive on any transaction\n• **\"Patterns in C-0042\"** — community analysis\n• **\"Queue summary\"** — overview stats\n• **\"How does the model work?\"** — explain the detection system\n• **\"Card ending 4521\"** — look up a specific card",
  };
}
