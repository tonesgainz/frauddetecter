import { NextResponse } from "next/server";
import { generateChatResponse } from "@/lib/chat-engine";

// POST /api/chat
// In production: calls Amazon Bedrock Agent with RAG over transaction data
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────────────────────
    // PRODUCTION INTEGRATION POINT
    // Replace the mock chat engine with Amazon Bedrock:
    //
    // import { BedrockAgentRuntimeClient, InvokeAgentCommand } from
    //   "@aws-sdk/client-bedrock-agent-runtime";
    //
    // const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });
    // const response = await client.send(new InvokeAgentCommand({
    //   agentId: process.env.BEDROCK_AGENT_ID,
    //   agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
    //   sessionId: sessionId || crypto.randomUUID(),
    //   inputText: message,
    // }));
    // ──────────────────────────────────────────────────────────

    const response = generateChatResponse(message);

    return NextResponse.json({
      reply: response.text,
      linkedTransactionId: response.linkedTxId || null,
      sessionId: sessionId || `session-${Date.now()}`,
      sources: [],
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
