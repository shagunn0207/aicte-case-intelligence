# AICTE Institution 360° — Cross-Bureau Case Intelligence Platform

**Smart India Hackathon (SIH 2026)**  
**Module:** Person 2 — Cross-Bureau Overlap Intelligence, Case Comparison & Coordination Review

---

## 🌟 Overview & Core Workflow

This application demonstrates a clean, professional, and accessible government workflow:
1. **Find Overlap (Dashboard)**: View potential cross-bureau overlaps in a clean table with search and review status filtering.
2. **Compare Cases**: Review the two cases side by side (Case ID, Bureau, description, status) and inspect the supplied algorithmic evidence.
3. **Officer Review**: Make a statutory determination (*Coordination Required*, *Not Related*, or *Further Review Required*) with identity verification and justification remarks.
4. **Review History**: Inspect the immutable chronological audit log of recorded determinations.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_USE_MOCK_DATA` | `true` | When `true`, uses client-side synthetic demo data stored in session storage. |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Base URL for the FastAPI backend service. |

> **Safety Notice:** When `VITE_USE_MOCK_DATA=false`, the platform connects to the live backend and does **not** silently fall back to mock data on network errors.

---

## 🏛️ Synthetic Demonstration Data

All demo records are synthetic and explicitly labeled:
`SYNTHETIC DEMO DATA — NOT OFFICIAL AICTE RECORDS`

* **Institution:** *Example Institute of Technology* (`AICTE-PID-100245`)
* **Case A:** `PGRC-2026-1042` (*Public Grievance Redressal Cell*, Under Review)
* **Case B:** `RB-2026-0281` (*Regulation Bureau*, In Progress)
* **Calculated Match Score:** `91%` (4 algorithmic evidence signals)

---

## 🤝 Teammate Integration Handover (Person 1 & Backend)

### Routes Exported for Person 1
* `/overlaps`: Overlap Dashboard table and summary counts.
* `/compare/:overlapId`: Unified Case Comparison and Coordination Review page.
* `/cases/:caseId`: Standalone case dossier view.

### Backend Endpoints Contract (FastAPI)
All network requests are isolated inside [`src/services/overlapApi.js`](file:///c:/Users/priti/aicte-case-intelligence/src/services/overlapApi.js):
* `GET /api/overlaps`
* `GET /api/overlaps/{overlap_id}`
* `GET /api/cases/{case_id}`
* `POST /api/overlaps/{overlap_id}/review`
* `POST /api/cases/{case_id}/actions`