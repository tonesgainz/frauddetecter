export type TransactionStatus = "PASS" | "FAIL" | "UNCERTAIN";
export type ReviewDecision = "approved" | "declined" | "escalated";

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  card: string;
  merchant: string;
  mcc: string;
  channel: string;
  location: string;
  device: string;
  ip: string;
  timestamp: string;
  status: TransactionStatus;
  confidence: number;
  riskFactors: string[];
  graphCommunity: string;
  relatedCards: number;
  similarCases: number;
  similarFraudRate: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
}

export const TRANSACTIONS: Transaction[] = [
  {
    id: "TX-9921002",
    amount: 4829.0,
    currency: "USD",
    card: "•••• 4521",
    merchant: "ElectroHub Online",
    mcc: "5732",
    channel: "ECOMMERCE",
    location: "Lagos, NG",
    device: "Android Chrome 121",
    ip: "41.58.xxx.xxx",
    timestamp: "2026-02-09T23:41:02Z",
    status: "FAIL",
    confidence: 0.18,
    riskFactors: [
      "Geo-velocity violation: 8,400km in 23 min from last txn in London",
      "First-time merchant for this card",
      "Amount 12x above cardholder average ($402)",
      "Device fingerprint not seen before",
      "IP flagged: Nigerian proxy, VPN detected",
    ],
    graphCommunity: "C-0042",
    relatedCards: 3,
    similarCases: 14,
    similarFraudRate: 0.86,
  },
  {
    id: "TX-8829341",
    amount: 1247.5,
    currency: "USD",
    card: "•••• 8832",
    merchant: "TechZone Direct",
    mcc: "5045",
    channel: "ECOMMERCE",
    location: "Miami, FL",
    device: "iPhone Safari 17",
    ip: "72.43.xxx.xxx",
    timestamp: "2026-02-09T23:38:17Z",
    status: "UNCERTAIN",
    confidence: 0.62,
    riskFactors: [
      "Transaction amount 3.2x above cardholder 30-day average",
      "Merchant has elevated fraud rate (2.1% vs 0.3% category avg)",
      "Time-of-day anomaly: 3:38 AM local, cardholder typically transacts 9AM-9PM",
    ],
    graphCommunity: "C-0018",
    relatedCards: 1,
    similarCases: 8,
    similarFraudRate: 0.38,
  },
  {
    id: "TX-7723091",
    amount: 89.99,
    currency: "GBP",
    card: "•••• 1190",
    merchant: "Prime Gadgets UK",
    mcc: "5732",
    channel: "POS_TAP",
    location: "London, UK",
    device: "Contactless Terminal",
    ip: "N/A",
    timestamp: "2026-02-09T23:35:44Z",
    status: "UNCERTAIN",
    confidence: 0.71,
    riskFactors: [
      "Card used at 3 different merchants within 12 minutes",
      "Merchant registered < 30 days ago",
    ],
    graphCommunity: "C-0007",
    relatedCards: 0,
    similarCases: 22,
    similarFraudRate: 0.22,
  },
  {
    id: "TX-6612847",
    amount: 12750.0,
    currency: "USD",
    card: "•••• 3309",
    merchant: "LuxWatch Exchange",
    mcc: "5944",
    channel: "ECOMMERCE",
    location: "Bucharest, RO",
    device: "Windows Edge 122",
    ip: "86.120.xxx.xxx",
    timestamp: "2026-02-09T23:32:08Z",
    status: "FAIL",
    confidence: 0.09,
    riskFactors: [
      "Amount is largest single transaction on card (lifetime max was $890)",
      "High-risk MCC: Jewelry/Watches + cross-border",
      "Card added to new device 4 minutes before transaction",
      "Shipping address differs from billing (different country)",
      "IP geolocation inconsistent with browser timezone",
      "3 failed CVV attempts in last hour",
    ],
    graphCommunity: "C-0042",
    relatedCards: 5,
    similarCases: 31,
    similarFraudRate: 0.94,
  },
  {
    id: "TX-5501293",
    amount: 340.0,
    currency: "EUR",
    card: "•••• 6677",
    merchant: "SportsDirect EU",
    mcc: "5941",
    channel: "ECOMMERCE",
    location: "Berlin, DE",
    device: "Android Firefox 124",
    ip: "185.22.xxx.xxx",
    timestamp: "2026-02-09T23:28:55Z",
    status: "UNCERTAIN",
    confidence: 0.55,
    riskFactors: [
      "Cardholder typically shops domestically (US), this is cross-border",
      "Device trust score below threshold (0.3/1.0)",
      "Merchant shares payment processor with 2 previously flagged merchants",
    ],
    graphCommunity: "C-0031",
    relatedCards: 2,
    similarCases: 5,
    similarFraudRate: 0.4,
  },
  {
    id: "TX-4409182",
    amount: 2199.0,
    currency: "USD",
    card: "•••• 9012",
    merchant: "DigiStore Pro",
    mcc: "5734",
    channel: "ECOMMERCE",
    location: "Kyiv, UA",
    device: "Linux Chrome 122",
    ip: "91.196.xxx.xxx",
    timestamp: "2026-02-09T23:25:31Z",
    status: "FAIL",
    confidence: 0.12,
    riskFactors: [
      "Card reported stolen 2 hours ago — issuer alert active",
      "Transaction attempted from sanctioned IP range",
      "Device fingerprint linked to 4 other declined cards in Community C-0042",
      "Merchant is on elevated monitoring list",
    ],
    graphCommunity: "C-0042",
    relatedCards: 4,
    similarCases: 19,
    similarFraudRate: 0.92,
  },
  {
    id: "TX-3318274",
    amount: 67.5,
    currency: "GBP",
    card: "•••• 5544",
    merchant: "CoffeeClub Online",
    mcc: "5812",
    channel: "ECOMMERCE",
    location: "Manchester, UK",
    device: "iPhone Safari 17",
    ip: "82.12.xxx.xxx",
    timestamp: "2026-02-09T23:22:09Z",
    status: "UNCERTAIN",
    confidence: 0.74,
    riskFactors: [
      "First e-commerce purchase from this card (previously POS-only)",
      "Delivery postcode differs from registered address",
    ],
    graphCommunity: "C-0007",
    relatedCards: 0,
    similarCases: 41,
    similarFraudRate: 0.12,
  },
];

export const COMMUNITIES = ["Overview", "C-0007", "C-0018", "C-0031", "C-0042"];
