import { NextResponse } from "next/server";

// POST /api/reviews
// In production: writes to SQS → RLHF pipeline → S3 preference dataset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, decision, reviewerId, notes } = body;

    if (!transactionId || !decision) {
      return NextResponse.json(
        { error: "transactionId and decision are required" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Write review decision to DynamoDB
    // 2. Send preference tuple to SQS FIFO queue
    // 3. Trigger RLHF preference collection Lambda
    // 4. Update transaction status in the review dashboard

    const review = {
      reviewId: `REV-${Date.now()}`,
      transactionId,
      decision,
      reviewerId: reviewerId || "analyst-001",
      notes: notes || "",
      timestamp: new Date().toISOString(),
      rlhfPreferenceId: `PREF-${Date.now()}`,
      pipelineStatus: "queued",
    };

    console.log("[RLHF] Review captured:", review);

    return NextResponse.json(review);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
