# Verification & Testing Checklist

This checklist confirms the end-to-end verification of all core modules in the **Agentic Housing Navigator**.

---

## Completed Verification Matrix

| Workflow / Module | Test Scenario | Verified Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Mission Creation** | Natural language prompt entry with informal, messy inputs | Successfully parses budget, location, bedrooms, furnishing, and move-in constraints | ✅ PASS |
| **Natural Language Parsing** | Gemini 3.7 Flash extraction with JSON schema validation | Extracts 7 core parameters; falls back safely to deterministic rules if offline | ✅ PASS |
| **Property Search & Query** | Filtering 30+ property inventory across 5 Bangalore localities | Correctly retrieves candidates within budget tolerances and geographic radius | ✅ PASS |
| **Deterministic Ranking** | 7-factor mathematical evaluation algorithm | Correctly weights Budget (30%), Location (25%), Type (15%), Beds (10%), Furnishing (10%), Date (5%), Amenities (5%) | ✅ PASS |
| **Recommendation Rationale** | Structured AI explanation generation | Outputs *Why Selected*, *What Matched*, and *Key Trade-offs* cleanly without AI slop | ✅ PASS |
| **Cross-Session Memory** | Updating floor and pet preferences in Preferences view | Persists to Firestore/LocalStorage; automatically informs future mission decomposition | ✅ PASS |
| **Pub/Sub Background Monitoring** | Cloud Scheduler + Pub/Sub monitoring trigger | Executes background worker, evaluates active missions, and records telemetry spans | ✅ PASS |
| **Duplicate Notification Prevention**| Triggering repeated monitoring cycles on the same dataset | Idempotency filter suppresses duplicate alerts for previously evaluated properties | ✅ PASS |
| **Human-in-the-Loop Gateway** | Initiating "Contact Property Owner" action | Pauses execution, prompts user with editable action draft, and executes only on explicit approval | ✅ PASS |
| **Observability & Telemetry** | Real-time audit log viewing & JSON export | Logs mission ID, agent, task name, duration (ms), retry count, and sanitized payloads | ✅ PASS |
| **UI Responsiveness & Navigation** | Desktop sidebar (lg:pl-64) + Mobile bottom/top navigation | Flawless responsive layout across mobile, tablet, and widescreen monitors | ✅ PASS |
| **Error Handling & Fallbacks** | Missing API keys or network partition simulation | Application continues functioning seamlessly using local deterministic scoring | ✅ PASS |

---

## 1-Click Verification for Judges
1. Open the application. Note the persistent **Hackathon Demo Mode** banner at the top.
2. Click **Step 1 (Create Mission)** → Click a preset button (e.g. *"Student 2BHK Near Campus"*) → Click **"Launch Autonomous Search Mission"**.
3. Watch the multi-agent orchestrator execute the 7-stage pipeline in real-time.
4. Navigate to **Step 3 (Ranked Matches)** to inspect verified match percentages, advantages, and trade-offs.
5. Click **"View Full Details"** on any property → Click **"Contact Owner"** to test the **Human-in-the-Loop Approval Modal**.
6. Click **"Trigger Background Event"** in the top demo bar to simulate a real-time Cloud Pub/Sub inbound match notification.
7. Click **Step 6 (Observability)** to inspect live telemetry spans, latency benchmarks, and sanitized JSON traces.
