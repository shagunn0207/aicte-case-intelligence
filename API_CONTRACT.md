# AICTE Case Intelligence — API Contract & Integration Specifications

> **Problem Statement SIH26264**: Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells.  
> **Backend Developer 1**: Database, Institution APIs, Case Retrieval APIs, Dashboard Statistics, and API Contract.  
> **Team Alignment**:
> - **Frontend Developer 1**: Main dashboard, institution registry, Institution 360° profile, and shared application layout.
> - **Frontend Developer 2**: Overlap intelligence, case comparison, relationship visualization, and coordination review UI.
> - **Backend Developer 2**: Case updates, action history, and coordination workflows.
> - **Person 5**: Python overlap-detection engine (`detect_overlaps(cases)`).

---

## 1. General API Conventions

- **Base URL**: `http://localhost:8000/api`
- **Interactive Documentation**: `http://localhost:8000/docs` (Swagger UI) & `http://localhost:8000/redoc`
- **Naming Convention**: `snake_case` strictly applied across all request and response fields.
- **Date/Time Formats**: ISO-8601 strings (e.g., `2026-10-20T11:30:00Z` or `2026-10-20T11:30:00`). All stored datetimes represent UTC.
- **Data Disclaimer**: All demo data, institution names, officer assignments, and complaint narratives are strictly synthetic and fictional.

---

## 2. Standard Enums & Allowed Values

### A. Complaint Statuses
1. `Pending` — Newly lodged complaint awaiting initial scrutiny or bureau assignment.
2. `Under Process` — Actively under investigation, notice issued, or hearing in progress.
3. `Disposed` — Formal decision/resolution recorded, compliance accepted, closed.
4. `Transferred` — Remitted to an external state council, university board, or affiliated agency.
5. `Escalated` — Elevated to the AICTE Standing Appellate Committee or senior leadership.

### B. Core Bureaus & Cells (Examples)
- `PGRC` — Public Grievance Redressal Cell
- `RB` — Regulation Bureau
- `Approval Bureau` — Approval Bureau (AB)
- `Policy and Academic Planning Bureau` — PAPB

### C. Overdue Case Definition
A complaint is defined as **Overdue** if and only if:
$$\text{due\_date} < \text{current\_time} \quad \text{AND} \quad \text{status} \neq \text{'Disposed'}$$

---

## 3. Core Endpoints

### 3.1 System Health Check

```http
GET /api/health
```

#### Response (200 OK)
```json
{
  "status": "ok"
}
```

---

### 3.2 Institution Registry & Search

```http
GET /api/institutions
```

#### Query Parameters
| Parameter | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `q` | string | No | null | None | Case-insensitive partial search against institution name or ID |
| `page` | integer | No | `1` | $\ge 1$ | 1-based page index |
| `page_size` | integer | No | `20` | $1 \le \text{page\_size} \le 100$ | Number of records per page |

#### Response (200 OK)
```json
{
  "items": [
    {
      "institution_id": "DEMO-AICTE-001",
      "name": "Apex Institute of Technology & Research",
      "region": "Uttar Pradesh",
      "case_count": 4
    },
    {
      "institution_id": "DEMO-AICTE-002",
      "name": "Sahyadri College of Engineering & Management",
      "region": "Karnataka",
      "case_count": 1
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 6
}
```

---

### 3.3 Institution 360° Profile

```http
GET /api/institutions/{institution_id}
```

Returns holistic institution credentials alongside all historical and active complaints across all Bureaus and Cells.

#### Path Parameters
- `institution_id` (string, required): The synthetic AICTE Permanent ID (e.g., `DEMO-AICTE-001`).

#### Response (200 OK)
```json
{
  "institution_id": "DEMO-AICTE-001",
  "name": "Apex Institute of Technology & Research",
  "address": "Plot 14, Knowledge Park III, Greater Noida",
  "region": "Uttar Pradesh",
  "institution_type": "Engineering & Technology",
  "case_count": 4,
  "created_at": "2026-06-28T10:00:00",
  "associated_cases": [
    {
      "case_id": "DEMO-CASE-001",
      "institution_id": "DEMO-AICTE-001",
      "category": "Fee Irregularities",
      "description": "Student grievance submitted regarding mandatory collection of unauthorized 'development and capitation fees' amounting to Rs. 65,000 in cash prior to hall ticket issuance for 3rd year B.Tech examinations.",
      "bureau": "PGRC",
      "status": "Under Process",
      "assigned_officer": "Dr. R. K. Sharma (Director, PGRC)",
      "received_date": "2026-10-04T10:00:00",
      "due_date": "2026-11-03T10:00:00",
      "last_action": "Explanation sought from Principal with 7-day compliance window",
      "next_action": "Evaluate institution response and verify bank transaction ledgers",
      "last_action_at": "2026-10-21T10:00:00"
    },
    {
      "case_id": "DEMO-CASE-002",
      "institution_id": "DEMO-AICTE-001",
      "category": "Faculty Grievance",
      "description": "Faculty association complaint alleging unauthorized deductions and 4-month salary withholding under the pretext of institutional financial crunch.",
      "bureau": "RB",
      "status": "Under Process",
      "assigned_officer": "Shri Arvind Verma (Regional Officer, Regulation Bureau)",
      "received_date": "2026-10-08T10:00:00",
      "due_date": "2026-11-07T10:00:00",
      "last_action": "Joint scrutiny notice issued to management board",
      "next_action": "Conduct virtual inquiry hearing with faculty representatives",
      "last_action_at": "2026-10-23T10:00:00"
    }
  ]
}
```

#### Error Response (404 Not Found)
```json
{
  "detail": "Institution with ID 'NON_EXISTENT' was not found."
}
```

---

### 3.4 Complaint Cases List, Multi-Filter & Search

```http
GET /api/cases
```

#### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `institution_id` | string | No | Filter by exact AICTE Institution ID |
| `bureau` | string | No | Filter by Bureau or Cell (`PGRC`, `RB`, `Approval Bureau`) |
| `status` | string | No | Filter by case status (`Pending`, `Under Process`, `Disposed`, `Transferred`, `Escalated`) |
| `region` | string | No | Filter cases by institution's region/state (e.g., `Karnataka`, `Uttar Pradesh`) |
| `category` | string | No | Case-insensitive partial filter by category (`Fee Irregularities`, `Faculty Grievance`) |
| `from_date` | datetime | No | ISO-8601 string; cases received on or after this timestamp |
| `to_date` | datetime | No | ISO-8601 string; cases received on or before this timestamp |
| `page` | integer | No | 1-based page index (Default `1`) |
| `page_size` | integer | No | Items per page (Default `20`, Max `100`) |

#### Sorting
Deterministically sorted by `received_date` descending (newest complaints first) with `case_id` descending as a stable tie-breaker.

#### Response (200 OK)
```json
{
  "items": [
    {
      "case_id": "DEMO-CASE-001",
      "institution_id": "DEMO-AICTE-001",
      "category": "Fee Irregularities",
      "description": "Student grievance submitted regarding mandatory collection of unauthorized development fees...",
      "bureau": "PGRC",
      "status": "Under Process",
      "assigned_officer": "Dr. R. K. Sharma (Director, PGRC)",
      "received_date": "2026-10-04T10:00:00",
      "due_date": "2026-11-03T10:00:00",
      "last_action": "Explanation sought from Principal with 7-day compliance window",
      "next_action": "Evaluate institution response and verify bank transaction ledgers",
      "last_action_at": "2026-10-21T10:00:00"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 9
}
```

#### Error Response (422 Unprocessable Content)
Triggered when `from_date > to_date` or pagination exceeds valid bounds (`page < 1` or `page_size > 100`).
```json
{
  "detail": "Invalid date range: 'from_date' cannot be later than 'to_date'."
}
```

---

### 3.5 Case Details & Action History Audit

```http
GET /api/cases/{case_id}
```

Returns the full complaint dossier, nested institution information, and the chronological action-history audit trail.

#### Response (200 OK)
```json
{
  "case_id": "DEMO-CASE-001",
  "institution_id": "DEMO-AICTE-001",
  "category": "Fee Irregularities",
  "description": "Student grievance submitted regarding mandatory collection of unauthorized development fees...",
  "bureau": "PGRC",
  "status": "Under Process",
  "assigned_officer": "Dr. R. K. Sharma (Director, PGRC)",
  "received_date": "2026-10-04T10:00:00",
  "due_date": "2026-11-03T10:00:00",
  "last_action": "Explanation sought from Principal with 7-day compliance window",
  "next_action": "Evaluate institution response and verify bank transaction ledgers",
  "last_action_at": "2026-10-21T10:00:00",
  "created_at": "2026-10-04T10:00:00",
  "updated_at": "2026-10-21T10:00:00",
  "institution": {
    "institution_id": "DEMO-AICTE-001",
    "name": "Apex Institute of Technology & Research",
    "address": "Plot 14, Knowledge Park III, Greater Noida",
    "region": "Uttar Pradesh",
    "institution_type": "Engineering & Technology"
  },
  "action_history": [
    {
      "id": 2,
      "case_id": "DEMO-CASE-001",
      "action_taken": "Interim response received from college management pleading clerical error",
      "action_by": "Dr. R. K. Sharma (PGRC)",
      "action_date": "2026-10-21T10:00:00",
      "remarks": "Institution claimed cash was towards outsourced software test preparation. Unacceptable under norms.",
      "next_action": "Evaluate institution response and verify bank transaction ledgers",
      "previous_status": "Under Process",
      "new_status": "Under Process"
    },
    {
      "id": 1,
      "case_id": "DEMO-CASE-001",
      "action_taken": "Official notice sent to institution requesting explanation for cash collections",
      "action_by": "Dr. R. K. Sharma (PGRC)",
      "action_date": "2026-10-11T10:00:00",
      "remarks": "Notice served via official speed post and email to Chairman and Principal",
      "next_action": "Await written response within 7 working days",
      "previous_status": "Pending",
      "new_status": "Under Process"
    }
  ]
}
```

#### Error Response (404 Not Found)
```json
{
  "detail": "Complaint case with ID 'NON_EXISTENT' was not found."
}
```

---

### 3.6 Cross-Bureau Dashboard Aggregate Statistics

```http
GET /api/dashboard
```

Computes live aggregate metrics directly from SQLite database records.

#### Response (200 OK)
```json
{
  "total_cases": 9,
  "pending_cases": 2,
  "under_process_cases": 3,
  "disposed_cases": 2,
  "transferred_cases": 1,
  "escalated_cases": 1,
  "overdue_cases": 1,
  "potential_overlaps": 1,
  "bureau_wise_workload": [
    {
      "bureau": "PGRC",
      "case_count": 4
    },
    {
      "bureau": "RB",
      "case_count": 3
    },
    {
      "bureau": "Approval Bureau",
      "case_count": 2
    }
  ],
  "status_distribution": [
    {
      "status": "Pending",
      "count": 2
    },
    {
      "status": "Under Process",
      "count": 3
    },
    {
      "status": "Disposed",
      "count": 2
    },
    {
      "status": "Transferred",
      "count": 1
    },
    {
      "status": "Escalated",
      "count": 1
    }
  ],
  "region_wise_cases": [
    {
      "region": "Uttar Pradesh",
      "case_count": 4
    },
    {
      "region": "Karnataka",
      "case_count": 1
    },
    {
      "region": "Maharashtra",
      "case_count": 1
    },
    {
      "region": "Tamil Nadu",
      "case_count": 1
    },
    {
      "region": "Telangana",
      "case_count": 1
    },
    {
      "region": "West Bengal",
      "case_count": 1
    }
  ],
  "recent_actions": [
    {
      "id": 4,
      "case_id": "DEMO-CASE-005",
      "action_taken": "Summons issued to Chairman following repeated hearing absences",
      "action_by": "Dr. Manjunath Swamy (AB)",
      "action_date": "2026-10-18T10:00:00",
      "remarks": "Matter escalated to Standing Appellate Committee due to unauthorized student enrollment",
      "next_action": "Emergency briefing scheduled before AICTE Standing Appellate Committee",
      "previous_status": "Under Process",
      "new_status": "Escalated"
    }
  ],
  "recent_overlaps": [
    {
      "review_id": 1,
      "primary_case_id": "DEMO-CASE-001",
      "secondary_case_id": "DEMO-CASE-002",
      "similarity_score": 0.89,
      "overlap_reason": "Coincident financial irregularities at DEMO-AICTE-001: Concurrent complaints across PGRC and RB indicate systematic cash collection while withholding faculty salaries.",
      "status": "Pending Review",
      "detected_at": "2026-10-24T10:00:00"
    }
  ]
}
```

---

## 4. Teammate Integration Specs

### A. Backend Developer 2 Integration (Action History & Updates)
- Model: `CaseAction` in `backend/models.py`.
- Relationship: `ComplaintCase.action_history` (`back_populates="case"`).
- When a case status or action is appended, Backend Developer 2 can insert into `case_actions` and update `complaint_cases.last_action`, `complaint_cases.last_action_at`, `complaint_cases.next_action`, and `complaint_cases.status`.

### B. Person 5 Integration (Overlap Detection Engine)
- Target signature: `detect_overlaps(cases: list[dict]) -> list[dict]`
- Model: `CoordinationReview` in `backend/models.py`.
- Dashboard metric `potential_overlaps` automatically queries `CoordinationReview.status == "Pending Review"`.
- Person 5 outputs feed into `coordination_reviews` with fields `primary_case_id`, `secondary_case_id`, `similarity_score`, `overlap_reason`.

### C. Frontend Developers 1 & 2 Integration (React / Vite)
- CORS is enabled by default for:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - `http://localhost:3000`
- Configurable via `CORS_ORIGINS` environment variable.
