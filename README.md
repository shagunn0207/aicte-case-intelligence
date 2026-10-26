# AICTE Case Intelligence Backend (SIH 2026 - Problem Statement SIH26264)

> **Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells**

---

## 🏛️ Project Overview

This backend system provides centralized data persistence, institution management, cross-bureau complaint case retrieval, multi-attribute filtering, and real-time dashboard analytics for AICTE complaint monitoring.

Designed to eliminate information silos across AICTE Bureaus and Cells (e.g., PGRC, Regulation Bureau, Approval Bureau), enabling early detection of duplicate or correlated complaints against educational institutions.

### Team Roles & Modular Architecture
- **Backend Developer 1 (This Module)**: SQLite database engine, core models (`Institution`, `ComplaintCase`, shared models), Institution 360° APIs, Case Search & Retrieval, Dashboard Statistics, and API Contract.
- **Backend Developer 2**: Case action history, status transitions, and joint coordination reviews.
- **Person 5**: AI/NLP Overlap-detection engine (`detect_overlaps(cases)`).
- **Frontend Developer 1**: Executive dashboard, institution registry, Institution 360° profile, and main UI shell.
- **Frontend Developer 2**: Overlap intelligence UI, case comparison view, and coordination workflow review panel.

---

## ⚙️ Technology Stack

- **Python**: 3.11+ (Tested on Python 3.13)
- **FastAPI**: Modern, high-performance web framework for APIs
- **SQLAlchemy 2.x**: Declarative ORM with SQLite foreign-key enforcement
- **SQLite**: Local, zero-configuration embedded SQL database
- **Pydantic v2**: Type safety and validation
- **Uvicorn**: High-speed ASGI server
- **Pytest**: Automated test suite with isolated test database

---

## 🚀 Quickstart Guide

### 1. Prerequisites
Ensure Python 3.11+ is installed.

### 2. Create and Activate Virtual Environment

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

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize Database & Seed Demo Data
The seed script initializes SQLite tables and safely populates synthetic demonstration data. It is **idempotent** (can be re-run repeatedly without creating duplicates).

```bash
python -m backend.seed
```

> **Synthetic Data Disclaimer**: All institutions, complaint narratives, case IDs, and officer assignments in the seed script are completely fictional and synthesized exclusively for demonstration purposes.

### 5. Start the FastAPI Development Server
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 6. Run the Automated Test Suite
Tests run against an isolated SQLite test database and will never alter or purge your development data.

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

---

## 📁 Repository Structure

```
.
├── API_CONTRACT.md            # Primary API Contract & Team Integration Guide
├── README.md                  # This setup and run documentation
├── requirements.txt           # Project dependencies
├── aicte_cases.db             # Local SQLite database (created on run/seed)
├── backend/
│   ├── __init__.py
│   ├── database.py            # SQLite engine, sessionmaker & foreign key pragma
│   ├── models.py              # SQLAlchemy models (Institution, ComplaintCase, CaseAction, CoordinationReview)
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── seed.py                # Idempotent synthetic data generator
│   ├── main.py                # FastAPI app setup, CORS, lifespan & router mounting
│   ├── API_CONTRACT.md        # Mirror copy of API contract
│   └── routes/
│       ├── __init__.py
│       ├── institutions.py    # Institution search & 360° profile endpoints
│       ├── cases.py           # Case search, filtering & detail endpoints
│       └── dashboard.py       # Aggregate analytics & overdue case logic
└── tests/
    ├── __init__.py
    ├── conftest.py            # Pytest fixtures and isolated test DB configuration
    └── test_backend.py        # 18 automated unit and integration tests
```

---

## 🔒 Security & CORS Settings

CORS is pre-configured for React / Vite frontend development servers:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Custom origins can be passed via the `CORS_ORIGINS` environment variable (comma-separated list).