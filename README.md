# Fraud Analyzer — Real-Time Transaction Monitoring

**SNF × Premier League** — AI-powered credit card fraud detection with live graph visualization, review queue, and chat assistant.

![Status](https://img.shields.io/badge/status-prototype-00d4aa)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main dashboard (orchestrates everything)
│   ├── globals.css         # Global styles + Tailwind
│   └── api/
│       ├── transactions/   # GET /api/transactions
│       ├── reviews/        # POST /api/reviews (RLHF feedback)
│       └── chat/           # POST /api/chat (AI assistant)
├── components/
│   ├── NetworkGraph.tsx    # WebGL canvas — animated network visualization
│   ├── TopBar.tsx          # Navigation + status counts
│   ├── ReviewQueue.tsx     # Filterable transaction queue
│   ├── EvidencePanel.tsx   # Evidence + risk factors + review actions
│   └── ChatPanel.tsx       # AI chat assistant with quick actions
├── data/
│   └── transactions.ts     # Mock data + TypeScript interfaces
└── lib/
    ├── chat-engine.ts      # Chat response logic (swap for Bedrock in prod)
    └── utils.ts            # Formatters + helpers
```

## Features

### Live Graph Visualization
- Force-directed network graph rendered on HTML5 Canvas
- Red glowing/pulsing nodes = FAIL transactions
- Amber glowing nodes = UNCERTAIN transactions  
- Community navigation tabs for cluster analysis
- Click any lit node to open evidence panel

### Review Queue
- Filter by ALL / FAIL / UNCERTAIN
- Sort by confidence, amount, or time
- One-click preview of top risk factor per transaction
- Reviewed transactions tracked separately

### Evidence Panel
- Full transaction details (amount, card, merchant, device, IP, location)
- Confidence score bar with FAIL/UNCERTAIN/PASS scale
- Risk factors ranked by severity with color-coded borders
- Community + similar case statistics
- **Three review actions**: Approve, Decline, Escalate
- Review decisions feed into RLHF pipeline

### AI Chat Assistant
- Natural language queries about transactions and patterns
- Quick action chips for common queries
- Transaction deep-dives with full risk analysis
- Community/fraud ring pattern detection
- Model explainability ("How does the model work?")
- Auto-selects referenced transactions in the review queue

## Production Deployment

### Swap mock data for real backends:

1. **Transactions API** → Amazon Kinesis + DynamoDB  
2. **Graph Data** → Amazon Neptune (Gremlin queries)  
3. **Chat Assistant** → Amazon Bedrock Agent with RAG  
4. **Review Pipeline** → SQS FIFO → RLHF training pipeline  
5. **Real-time updates** → AWS AppSync WebSocket subscriptions  

See `.env.example` for required environment variables.

### Deploy to Vercel

```bash
# One-time: log in (opens browser)
npx vercel login

# Build and deploy to production
npm run build
npx vercel --prod
```

Set any environment variables in the [Vercel dashboard](https://vercel.com/dashboard) under your project → Settings → Environment Variables. The prototype runs without env vars; add them when wiring to AWS (Bedrock, DynamoDB, etc.).

### Bootstrap from AWS Solutions Library

Fork [aws-solutions-library-samples/fraud-detection-using-machine-learning](https://github.com/aws-solutions-library-samples/fraud-detection-using-machine-learning) for the CloudFormation + Lambda + SageMaker backend, then connect this frontend to those endpoints.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: HTML5 Canvas (custom WebGL-ready)
- **Animation**: Framer Motion + CSS animations
- **Icons**: Lucide React

## License

Proprietary — SNF Global LLC
