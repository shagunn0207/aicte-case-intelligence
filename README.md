# AICTE Institution 360° — Cross-Bureau Case Intelligence Platform

> **Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells**  
> **Smart India Hackathon (SIH 2026 - Problem Statement SIH26264)**

---

## 🏛️ Project Overview

This platform provides centralized data persistence, cross-bureau complaint case retrieval, automated overlap detection, and real-time dashboard analytics for AICTE complaint monitoring.

Designed to eliminate information silos across AICTE Bureaus and Cells (e.g., PGRC, Regulation Bureau, Approval Bureau), enabling early detection of duplicate or correlated complaints against educational institutions and coordinated regulatory review.

### Team Roles & Modular Architecture
- **Backend Developer 1**: SQLite database engine, core models (`Institution`, `ComplaintCase`, shared models), Institution 360° APIs, Case Search & Retrieval, Dashboard Statistics, and API Contract.
- **Backend Developer 2**: Case action history, status transitions, and joint coordination reviews.
- **Person 5**: AI/NLP Overlap-detection engine (`detect_overlaps(cases)`).
- **Frontend Developer 1**: Executive dashboard, institution registry, Institution 360° profile, and main UI shell.
- **Frontend Developer 2**: Overlap intelligence UI, case comparison view, and coordination workflow review panel.

---

## 💻 Frontend (React + Vite)

The frontend provides an intuitive, accessible interface for institutional case intelligence:
1. **Find Overlap (Dashboard)**: View potential cross-bureau overlaps in a clean table with search and review status filtering.
2. **Compare Cases**: Review two cases side by side (Case ID, Bureau, description, status) and inspect supplied algorithmic evidence.
3. **Officer Review**: Make a statutory determination (*Coordination Required*, *Not Related*, or *Further Review Required*) with identity verification and justification remarks.
4. **Review History**: Inspect the immutable chronological audit log of recorded determinations.

### Frontend Quickstart

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Running at http://localhost:5173

# Production build
npm run build
```

### Frontend Configuration (`.env`)

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_USE_MOCK_DATA` | `true` | When `true`, uses client-side synthetic demo data stored in session storage. |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Base URL for the FastAPI backend service. |

> **Safety Notice:** When `VITE_USE_MOCK_DATA=false`, the platform connects to the live backend and does **not** silently fall back to mock data on network errors.

---

## ⚙️ Backend (FastAPI + SQLite)

### Technology Stack
- **Python**: 3.11+ (Tested on Python 3.13)
- **FastAPI**: Modern, high-performance web framework for APIs
- **SQLAlchemy 2.x**: Declarative ORM with SQLite foreign-key enforcement
- **SQLite**: Local, zero-configuration embedded SQL database
- **Pydantic v2**: Type safety and validation
- **Uvicorn**: High-speed ASGI server
- **Pytest**: Automated test suite with isolated test database

### Backend Quickstart

1. **Create and Activate Virtual Environment**

   **Windows (PowerShell):**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

   **macOS / Linux:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize Database & Seed Data**
   The seed script initializes SQLite tables and populates synthetic demonstration data. It is **idempotent** (can be re-run repeatedly without creating duplicates).
   ```bash
   python -m backend.seed
   ```

4. **Start the FastAPI Development Server**
   ```bash
   uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
   - **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

5. **Run the Automated Test Suite**
   ```bash
   pytest -v
   ```

---

## 📡 API Contract Summary

Full contract specifications are available in [`API_CONTRACT.md`](./API_CONTRACT.md).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check (`{"status": "ok"}`) |
| `GET` | `/api/institutions` | Search & list institutions with case counts & pagination (`q`, `page`, `page_size`) |
| `GET` | `/api/institutions/{id}` | Institution 360° Profile with all associated complaints across Bureaus |
| `GET` | `/api/cases` | Case list with multi-filtering (`institution_id`, `bureau`, `status`, `region`, `category`, `from_date`, `to_date`, pagination) |
| `GET` | `/api/cases/{id}` | Case details dossier with institution info & action audit history |
| `GET` | `/api/dashboard` | Live cross-bureau aggregate statistics, workload, and distributions |
| `POST` | `/api/overlaps/{id}/review` | Record cross-bureau coordination determination |
| `POST` | `/api/cases/{id}/actions` | Log procedural event to case timeline |

---

## 📁 Repository Structure

```
.
├── API_CONTRACT.md            # Primary API Contract & Team Integration Guide
├── README.md                  # Unified project documentation
├── requirements.txt           # Python backend dependencies
├── package.json               # Frontend dependencies & scripts
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind theme configuration
├── index.html                 # HTML entry point
├── src/                       # React Frontend Application
│   ├── components/            # Layout, common, and overlap domain components
│   ├── pages/                 # OverlapIntelligence, CaseDetails, CoordinationReview
│   ├── services/              # overlapApi.js (central API client)
│   ├── mocks/                 # overlapMockData.js (synthetic session store)
│   └── utils/                 # formatters.js
├── backend/                   # FastAPI Backend Application
│   ├── database.py            # SQLite engine, sessionmaker & foreign keys
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   ├── seed.py                # Idempotent synthetic data generator
│   ├── main.py                # FastAPI app setup, CORS, lifespan & router mounting
│   └── routes/                # Endpoint route handlers (institutions, cases, dashboard)
└── tests/                     # Backend Automated Test Suite
    ├── conftest.py            # Pytest fixtures and test DB
    └── test_backend.py        # Automated unit and integration tests
```

---

## 🔒 Security & CORS Settings

CORS is pre-configured for React / Vite frontend development servers:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Custom origins can be passed via the `CORS_ORIGINS` environment variable (comma-separated list).
