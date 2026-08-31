# Hackathon Compliance & Requirements Checklist

This document details the precise mapping of the **Agentic Housing Navigator** codebase to the Google Cloud & Agentic AI Hackathon requirements.

---

## 1. Gemini 3.5+ Model Integration
- **Model Used**: `gemini-3.7-flash` via `@google/genai` official TypeScript SDK.
- **Implementation**:
  - `server/gemini.ts` and `src/services/geminiService.ts`: Server-side and client-proxy execution for structured JSON schema response decomposition and natural-language constraint understanding.
  - Generates verifiable trade-off explanations (*Why selected, What matched, What did not match, Trade-offs, Estimated cost*) without leaking hidden chain-of-thought tokens.
  - Safe deterministic fallbacks ensure $100\%$ uptime even during API rate limits.

---

## 2. Google Agent Framework (ADK Pattern)
- **Multi-Agent Orchestrator**: `src/services/agentService.ts` and `src/services/missionService.ts`.
- **Specialized Agents Implemented**:
  1. `RequirementAgent`: Decomposes messy natural-language prompts into 7 structured search constraints.
  2. `SearchAgent`: Executes targeted property candidate queries across verified database collections.
  3. `EvaluationAgent`: Computes multi-attribute 7-factor match scores ($0–100\%$) with mathematical transparency.
  4. `RankingAgent`: Orders results and synthesizes user-facing trade-off rationales.
  5. `CommunicationAgent`: Drafts owner inquiries under a strict **Human-in-the-Loop Controlled Action Workflow**.
  6. `MonitoringAgent`: Executes autonomous background match cycles against new inventory.

---

## 3. Google Cloud Infrastructure
- **Google Cloud Run**: Containerized Node.js/Express server and React SPA running on port 3000 with production bundle optimization.
- **Google Cloud Firestore**: Persistent NoSQL storage for active missions, shortlisted items, user preference memory, telemetry spans, and notifications.
- **Google Cloud Pub/Sub**: Event-driven asynchronous messaging backbone with dedicated topics:
  - `housing-monitoring`
  - `property-updates`
  - `agent-events`
- **Google Cloud Scheduler**: 15-minute periodic cron daemon (`*/15 * * * *`) generating heartbeat events that trigger background worker evaluations.

---

## 4. Autonomous Workflow
- Users define a goal once via natural language.
- The agent coordinates multiple sub-agents to parse requirements, query datasets, score candidates, and persist cross-session memory without constant manual input.
- Cross-session memory automatically applies learned preferences (such as avoiding ground floor flats or requiring pet-friendly apartments) to all future missions.

---

## 5. Asynchronous / Background Execution
- The agent continues operating even after users leave the browser session.
- Cloud Scheduler publishes periodic heartbeat events to Pub/Sub topics, invoking the stateless Cloud Run background monitoring worker to evaluate active Firestore missions against new properties.
- In-memory/Firestore idempotency prevents duplicate notifications for previously evaluated properties.
- Instant alert banners and telemetry logs notify users when a new $>85\%$ match arrives.

---

## 6. Security & Human Safeguards
- **Zero Exposed Keys**: All API secrets are isolated in server-side environment variables (`GEMINI_API_KEY`).
- **Human-in-the-Loop Gateway**: High-impact actions (e.g. contacting property landlords) require explicit human approval via the **"Agent Action Requires Approval"** modal with Approve, Edit, and Reject capabilities.

---

## 7. Repository Reproducibility
- Standardized `package.json` with strict type scripts (`tsc --noEmit` and `vite build`).
- Self-contained demo property dataset (`src/data/properties.ts`) alongside live Pub/Sub simulation triggers for immediate, zero-friction judging verification.
