# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fraud Analyzer is a real-time credit card fraud detection dashboard built with Next.js 14 and TypeScript. It features AI-powered transaction monitoring with live graph visualization, a review queue for human analysts, and an intelligent chat assistant. Currently a prototype with clear production integration points for AWS services (Bedrock, DynamoDB, Neptune, SageMaker, SQS).

## Commands

```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint
```

No test framework is configured yet.

## Architecture

### State Management
The main dashboard (`/src/app/page.tsx`) is a client component that orchestrates all application state:
- `view`: toggles between "dashboard" (graph) and "review" (queue)
- `selectedTx`: currently inspected transaction
- `reviewed`: map of transaction ID → review decision
- `queueFilter`: filters by FAIL/UNCERTAIN/ALL
- `activeCommunity`: community tab selector

All child components receive state via props.

### Key Components
- **NetworkGraph.tsx**: Custom Canvas-based force-directed visualization (no D3/Three.js). Renders 320 ambient nodes + transaction nodes with interactive hit detection
- **ReviewQueue.tsx**: Filterable transaction list with status badges
- **EvidencePanel.tsx**: Transaction details, risk factors, community stats, and approve/decline/escalate actions
- **ChatPanel.tsx**: AI assistant sidebar with quick action chips and message history

### API Routes
- `GET /api/transactions` - Query by status and community
- `POST /api/chat` - Chat assistant responses (rule-based, swap for Bedrock)
- `POST /api/reviews` - Capture review decisions (logs RLHF preference ID)

### Data Layer
- Mock data in `/src/data/transactions.ts` with full TypeScript interfaces
- Chat engine in `/src/lib/chat-engine.ts` uses pattern matching for responses
- Utilities in `/src/lib/utils.ts` for formatting and status colors

### Production Swap Points
The prototype is designed for these replacements:
- `generateChatResponse()` → AWS Bedrock Agent API
- Transactions API → DynamoDB + Neptune (Gremlin queries)
- Review submissions → SQS FIFO queue → RLHF Lambda pipeline

## TypeScript

Path alias configured: `@/*` → `./src/*`

Key types in `/src/data/transactions.ts`:
- `TransactionStatus`: "PASS" | "FAIL" | "UNCERTAIN"
- `ReviewDecision`: "approved" | "declined" | "escalated"
- `Transaction`: Full transaction shape with risk factors and graph community data

## Design System

- Navy background: `#0a1628`
- Teal accent: `#00d4aa`
- Status colors: FAIL (`#f44336`), UNCERTAIN (`#ff9800`), PASS (`#4CAF50`)
- Font: JetBrains Mono (monospace throughout)
