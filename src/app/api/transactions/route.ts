import { NextResponse } from "next/server";
import { TRANSACTIONS } from "@/data/transactions";

// GET /api/transactions
// In production, this queries DynamoDB / Neptune
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const community = searchParams.get("community");

  let results = TRANSACTIONS;

  if (status) {
    results = results.filter((t) => t.status === status);
  }
  if (community) {
    results = results.filter((t) => t.graphCommunity === community);
  }

  return NextResponse.json({
    transactions: results,
    total: results.length,
    timestamp: new Date().toISOString(),
  });
}
