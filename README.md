# Agentic Housing Navigator 🧭
*Autonomous, Multi-Agent Real Estate Mission Control Powered by Google Cloud, Google ADK & Gemini 3.7 Flash*

[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Cloud_Run_%7C_Firestore_%7C_Pub%2FSub_%7C_Scheduler-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com)
[![Gemini](https://img.shields.io/badge/Gemini-3.7_Flash_%7C_@google/genai-8E75B2?logo=google&logoColor=white)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev)

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [The Problem](#-the-problem)
3. [The Solution](#-the-solution)
4. [Why It Is Agentic (Not Just a Chatbot)](#-why-it-is-agentic-not-just-a-chatbot)
5. [Taskmaster Track Alignment](#-taskmaster-track-alignment)
6. [Key Features](#-key-features)
7. [System Architecture](#-system-architecture)
8. [Multi-Agent Workflow & ADK Pattern](#-multi-agent-workflow--adk-pattern)
9. [Google Technology Stack](#-google-technology-stack)
   - [Gemini 3.7 Flash & @google/genai](#gemini-37-flash--googlegenai)
   - [Google Cloud Run](#google-cloud-run)
   - [Google Cloud Firestore](#google-cloud-firestore)
   - [Google Cloud Pub/Sub](#google-cloud-pubsub)
   - [Google Cloud Scheduler](#google-cloud-scheduler)
10. [Authentication & User Isolation](#-authentication--user-isolation)
11. [Cross-Session Memory Engine](#-cross-session-memory-engine)
12. [Autonomous Background Monitoring](#-autonomous-background-monitoring)
13. [Observability & OpenTelemetry Tracing](#-observability--opentelemetry-tracing)
14. [Security & Human Safeguards (HITL)](#-security--human-safeguards-hitl)
15. [Quick Start & Setup](#-quick-start--setup)
16. [Environment Variables](#-environment-variables)
17. [Cloud Deployment Guide](#-cloud-deployment-guide)
18. [4-Minute Hackathon Demo Script for Judges](#-4-minute-hackathon-demo-script-for-judges)
19. [Hackathon Compliance Summary](#-hackathon-compliance-summary)

---

## 🌟 Project Overview

**Agentic Housing Navigator** is an autonomous real estate search mission control that turns messy, natural-language human housing requests into deterministic, multi-agent missions. It operates asynchronously in the background, continuously monitors real estate feeds, evaluates properties using a mathematical 7-factor scoring engine, maintains cross-session lifestyle memory, and enforces Human-in-the-Loop approval before taking external actions.

---

## 🛑 The Problem

Finding rental housing is currently one of the most stressful, fragmented, and time-consuming tasks:
- **Search Fatigue:** Renters spend hours manually refreshing portals, applying filters, and checking new listings.
- **Hidden Trade-offs:** Portals show photos and prices, but hide crucial trade-offs (e.g., ground floor noise, high security deposits, long commutes).
- **Transient Memory:** When users start a new search, they have to re-enter all their preferences and rules from scratch.
- **Passive Portals:** Traditional real estate platforms do not act autonomously on behalf of the tenant; they merely display static records.

---

## 💡 The Solution

**Agentic Housing Navigator** flips the paradigm from **passive search** to **autonomous mission execution**:
1. **Natural Language Goal Decomposition:** Express requirements naturally (*"Find a furnished 2BHK near Koramangala with power backup and high floor under ₹22,000"*).
2. **Deterministic 7-Factor Mathematical Scoring (0–100%):** Provides transparent mathematical matching alongside Gemini-generated trade-off explanations.
3. **Cross-Session Memory Persistence:** Remembers user constraints (floor preference, pet restrictions, commute limits) across browser sessions.
4. **Cloud-Native Background Monitoring:** Cloud Scheduler and Pub/Sub wake up background workers to evaluate new inventory without requiring an open browser.
5. **Human-in-the-Loop Gateway:** Drafts outreach messages to landlords, pausing for user approval before dispatching.

---

## 🤖 Why It Is Agentic (Not Just a Chatbot)

| Dimension | Conventional Real Estate Chatbot | Agentic Housing Navigator |
| :--- | :--- | :--- |
| **Execution Model** | Single-turn Q&A prompt/response | Multi-agent autonomous pipeline with state machine |
| **Persistence** | Ephemeral chat session | Durable Firestore missions, shortlists, and memory |
| **Background Action**| Stops when user closes tab | Runs asynchronously via Cloud Scheduler & Pub/Sub |
| **Decision Logic** | Hallucination-prone text generation | Hybrid deterministic 7-factor scoring + AI rationale |
| **External Actions** | Informs user or generates raw text | Human-in-the-Loop approval gate with draft staging |
| **Telemetry** | None | Full OpenTelemetry-style span traces & latency logs |

---

## 🎯 Taskmaster Track Alignment

Agentic Housing Navigator squarely addresses the **Taskmaster** track:
- **Autonomous Task Execution:** Decomposes complex real estate discovery into independent, verifiable sub-tasks.
- **Multi-Step Coordination:** Chains Requirement Analysis → Inventory Querying → Budget & Commute Verification → Deterministic Ranking → Trade-Off Synthesis → Outreach Drafting.
- **Resilient Background Execution:** Continues task execution independently via Google Cloud event-driven infrastructure.

---

## 🚀 Key Features

- **Natural Language Parsing:** Powered by Gemini 3.7 Flash with structured JSON schema outputs.
- **7-Factor Mathematical Match Engine:** Budget (30%), Location (25%), Property Type (15%), Bedrooms (10%), Furnishing (10%), Move-In Date (5%), Amenities (5%).
- **AI Recommendation Rationales:** Structured explanations (*Why Selected, Key Advantages, Trade-offs, Total Estimated Upfront Cost*).
- **Autonomous Background Listener:** Evaluates new listings via Pub/Sub events with built-in idempotency to prevent duplicate alerts.
- **Human-in-the-Loop Gateway:** Approve, Edit, or Reject agent actions (e.g., landlord outreach).
- **Deep Observability:** Telemetry viewer with latency graphs, retry traces, and sanitized JSON payloads.
- **Interactive Comparison Engine:** Side-by-side multi-property analysis with highlighted parameter parity.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │                 Client Layer (Browser / Mobile)        │
                               │  [ React 18 + Vite + Tailwind CSS + Lucide Icons ]     │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ HTTPS / REST
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │           Google Cloud Run Container (Port 3000)       │
                               │  [ Node.js + Express API Layer + ADK Orchestrator ]    │
                               └───────┬───────────────────┬───────────────────┬────────┘
                                       │                   │                   │
                ┌──────────────────────┘                   │                   └──────────────────────┐
                ▼                                          ▼                                          ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐       ┌──────────────────────────────┐
│    Gemini 3.7 Flash Model    │       │    Google Cloud Firestore    │       │    Google Cloud Pub/Sub      │
│  (@google/genai SDK Proxy)   │       │  (Missions, Memory, Events)  │       │  (Topics & Push Subscriptions│
└──────────────────────────────┘       └──────────────────────────────┘       └──────────────▲───────────────┘
                                                                                             │
                                                                              ┌──────────────┴───────────────┐
                                                                              │    Google Cloud Scheduler    │
                                                                              │  (15-Minute Periodic Cron)   │
                                                                              └──────────────────────────────┘
```

---

## 🧩 Multi-Agent Workflow & ADK Pattern

The system implements the **Google Agent Development Kit (ADK)** architectural pattern using specialized, decoupled agent modules:

1. **`HousingOrchestrator` (Root Coordinator):** Coordinates the execution lifecycle, handles state transitions, and manages recovery.
2. **`RequirementAgent`:** Uses Gemini 3.7 Flash with strict JSON schema definitions to extract 7 structured search parameters.
3. **`SearchAgent`:** Executes targeted multi-criteria property queries with bounding filters.
4. **`BudgetAgent`:** Calculates total financial impact including monthly rent, security deposits, maintenance fees, and upfront commitments.
5. **`LocationAgent`:** Computes commute distances, travel durations (walking, two-wheeler, driving), and proximity scores.
6. **`PreferenceAgent`:** Enforces lifestyle constraints from persistent memory (e.g., floor levels, pet friendliness, parking).
7. **`RankingAgent`:** Executes the deterministic 7-factor scoring engine and requests Gemini-generated trade-off breakdowns.
8. **`CommunicationAgent`:** Prepares landlord inquiries under the Human-in-the-Loop approval gate.
9. **`MonitoringAgent`:** Stateless background worker invoked by Pub/Sub to evaluate active missions against new inventory.

---

## ☁️ Google Technology Stack

### Gemini 3.7 Flash & @google/genai
- Integrated using the official `@google/genai` TypeScript SDK.
- Used for structured JSON extraction, natural language constraint understanding, and structured trade-off summaries.
- Server-side proxy keeps all API keys secure while client-side fallback guarantees 100% availability during network partitions.

### Google Cloud Run
- Containerized Node.js service hosting the backend REST API, ADK multi-agent orchestrator, and production React SPA.
- Supports horizontal scaling, health checks, and graceful shutdown handling.

### Google Cloud Firestore
- Persistent storage for user profiles, search missions, shortlisted properties, long-term memory preferences, and telemetry event logs.
- Dual-mode architecture: seamlessly uses Cloud Firestore in production and in-memory persistence in local development.

### Google Cloud Pub/Sub
- Event-driven asynchronous backbone with dedicated topics:
  - `housing-monitoring`: Heartbeats for active mission evaluation.
  - `property-updates`: Ingestion pipeline for newly listed rental units.
  - `agent-events`: Real-time telemetry and audit stream.

### Google Cloud Scheduler
- Triggers periodic cron jobs (`*/15 * * * *`) that post messages to Pub/Sub, keeping search missions active 24/7.

---

## 🔐 Authentication & User Isolation

- **Token-Based Authentication:** Clean user authentication with session tokens stored in secure local storage.
- **User Data Isolation:** All Firestore repositories filter queries by `userId`, preventing unauthorized cross-user data access.
- **Graceful Session Restoration:** Zero UI flashing on initial load with animated loading spinners during session verification.

---

## 🧠 Cross-Session Memory Engine

- **Long-Term Preference Store:** Remembers learned constraints across search missions (e.g., floor level, pet policies, commute hubs).
- **Auto-Enrichment:** When creating new search missions, the orchestrator automatically enriches natural-language prompts with stored memory constraints.
- **Interactive Management:** Users can view, edit, or delete stored preferences in the `/preferences` tab.

---

## 📡 Autonomous Background Monitoring

- **24/7 Listing Watcher:** Operates even after the user closes the browser.
- **Idempotent Evaluation:** Prevents duplicate notifications by tracking evaluated property IDs per mission.
- **Real-Time Match Alerts:** Generates high-priority notifications and instant modal banners when a listing scores $>85\%$.

---

## 📊 Observability & OpenTelemetry Tracing

- **Audit & Telemetry Log:** Records every agent execution, tool call, model invocation, latency (ms), and retry event.
- **Sanitized Payloads:** Automatic redaction of sensitive user credentials and tokens before persisting logs.
- **1-Click Export:** Download full JSON telemetry traces for auditability and grading verification.

---

## 🛡️ Security & Human Safeguards (HITL)

- **Zero Client-Side Secrets:** `GEMINI_API_KEY` is strictly managed server-side.
- **Human-in-the-Loop Approval:** The agent cannot contact property owners or schedule viewings without explicit user authorization.
- **Editable Drafts:** Users can review, edit, or reject the proposed inquiry message before dispatching.

---

## 💻 Quick Start & Setup

### Prerequisites
- Node.js 18+ or Bun
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/example/agentic-housing-navigator.git
cd agentic-housing-navigator

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Add your GEMINI_API_KEY in .env

# Start development server (boots on port 3000)
npm run dev
```

---

## ⚙️ Environment Variables

Declare the following variables in `.env`:

```env
# Server Port (Default: 3000)
PORT=3000

# Google Gemini API Key (Server-side only)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Cloud Project Configuration (Optional for cloud deployment)
GOOGLE_CLOUD_PROJECT=your-project-id
FIRESTORE_EMULATOR_HOST=
```

---

## 🚀 Cloud Deployment Guide

### Deploy to Google Cloud Run
```bash
# Build the production bundle
npm run build

# Build and deploy container image to Cloud Run
gcloud run deploy agentic-housing-navigator \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_api_key"
```

---

## 🎬 4-Minute Hackathon Demo Script for Judges

Use the persistent **Hackathon Demo Bar** at the top of the interface to walk through the entire autonomous workflow:

1. **Minute 1: Mission Creation (`/create-mission`)**
   - Click the preset button *"Koramangala 2BHK Under ₹22k"*.
   - Point out how Gemini 3.7 Flash parses informal text into 7 structured parameters.
   - Click **"Launch Autonomous Search Mission"**.

2. **Minute 2: Multi-Agent Execution & Ranking (`/active-mission`)**
   - Observe the live 8-stage progress tracker as sub-agents coordinate in real-time.
   - Inspect the ranked property cards showing transparent match scores and Gemini-generated trade-off badges.

3. **Minute 3: Human-in-the-Loop Gateway (`/property-details`)**
   - Open the top-ranked property card and click **"Contact Owner"**.
   - Show the **"Agent Action Requires Approval"** modal. Demonstrate editing the proposed draft and approving the action.

4. **Minute 4: Background Monitoring & Telemetry (`Top Demo Bar` & `/activity`)**
   - Click **"Trigger Background Event"** in the top bar to simulate an inbound Pub/Sub listing match.
   - Observe the instant 97% match notification banner.
   - Open `/activity` to show the full OpenTelemetry trace logs, latency metrics, and model names.

---

## 📋 Hackathon Compliance Summary

- **Gemini 3.5+**: Verified (`gemini-3.7-flash` via `@google/genai`).
- **Google Agent Framework**: Verified (ADK Multi-Agent Orchestrator with 9 specialized agents).
- **Google Cloud Run**: Verified (Containerized full-stack deployment on port 3000).
- **Google Cloud Firestore**: Verified (Persistent missions, memory, and telemetry).
- **Google Cloud Pub/Sub & Scheduler**: Verified (Asynchronous background monitoring daemon).
- **Human-in-the-Loop Safeguards**: Verified (Approval modal with draft editing).
- **Autonomous Execution**: Verified (End-to-end mission lifecycle without manual intervention).

---

*Built with ❤️ for the Google Cloud & Agentic AI Hackathon.*


#   A g e n t i c - H o u s i n g - N a v i g a t o r  
 