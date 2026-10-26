# AICTE Case Intelligence — API Contract & Integration Specifications

> **Problem Statement SIH26264**: Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells.  
> **Backend Integration**: Database, Institution Registry, Complaint Dossiers, Cross-Bureau Overlap Detection, Human Coordination Review, Action History Audit, and Real-Time Dashboard Analytics.  
> **Team Alignment**:
> - **Frontend Developer 1**: Main dashboard, institution registry, Institution 360° profile, and shared application layout.
> - **Frontend Developer 2**: Overlap intelligence, case comparison, relationship visualization, and coordination review UI.
> - **Backend Developer 1**: SQLite database foundation, core schemas, baseline APIs, and synthetic demo seeder.
> - **Backend Developer 2**: Case updates, timeline action history, overlap review persistence, deadline calculations, and router integration.
> - **Person 5**: Local Python overlap-detection matching engine (`detect_overlaps(cases)`).

---

## 1. General API Conventions

- **Base URL**: `http://localhost:8000/api`
- **Interactive Documentation**: `http://localhost:8000/docs` (Swagger UI) & `http://localhost:8000/redoc`
- **Naming Convention**: `snake_case` applied across backend models. For overlap payloads, both `snake_case` and `camelCase` fields are provided simultaneously to guarantee seamless frontend React/Vite compatibility.
- **Date/Time Formats**: ISO-8601 strings (e.g., `2026-10-20T11:30:00Z` or `2026-10-20T11:30:00`). Stored datetimes represent naive UTC.
- **Data Disclaimer**: All demo data, institution names, officer assignments, and complaint narratives are strictly synthetic and fictional.

---

## 2. Standard Enums & Allowed Values

### A. Complaint Statuses
1. `Pending` — Newly lodged complaint awaiting initial scrutiny or bureau assignment.
2. `Under Process` — Actively under investigation, notice issued, or hearing in progress.
3. `Disposed` — Formal decision/resolution recorded, compliance accepted, closed.
4. `Transferred` — Remitted to an external state council, university board, or affiliated agency.
5. `Escalated` — Elevated to the AICTE Standing Appellate Committee or senior leadership.

### B. Coordination Review Determinations
1. `Coordination Required` — Linked cross-bureau issues detected; joint inquiry, inspection, or synchronized hearings required.
2. `Continue Independently` — Independent proceedings warranted; no joint regulatory intervention required.
3. `Not Related` — Algorithmic false positive or coincidental keyword match; complaint proceedings remain strictly separate. Suppresses recurring alerts under "Pending Review".
4. `Further Review Required` — Evidence ambiguous or incomplete; escalated for higher supervisory or regional review.

### C. Overdue Case Definition
A complaint is defined as **Overdue** if and only if:
$$\text{due\_date} < \text{current\_time} \quad \text{AND} \quad \text{status} \neq \text{'Disposed'}$$

### D. Approaching Deadline Definition
A case is classified as **Approaching Deadline** if:
$$\text{current\_time} \le \text{due\_date} \le \text{current\_time} + 48\,\text{hours} \quad \text{AND} \quad \text{status} \neq \text{'Disposed'}$$

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

Returns comprehensive institution profile credentials alongside all associated active and historical complaints.

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
      "description": "Student grievance submitted regarding mandatory collection of unauthorized capitation fees...",
      "bureau": "PGRC",
      "status": "Under Process",
      "assigned_officer": "Dr. R. K. Sharma (Director, PGRC)",
      "received_date": "2026-10-04T10:00:00",
      "due_date": "2026-11-03T10:00:00",
      "last_action": "Explanation sought from Principal",
      "next_action": "Evaluate institution response",
      "last_action_at": "2026-10-21T10:00:00"
    }
  ]
}
```

---

### 3.4 Complaint Cases List & Multi-Filter

```http
GET /api/cases
```

#### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `institution_id` | string | No | Filter by exact AICTE Institution ID |
| `bureau` | string | No | Filter by Bureau or Cell (`PGRC`, `RB`, `Approval Bureau`) |
| `status` | string | No | Filter by case status (`Pending`, `Under Process`, `Disposed`, `Transferred`, `Escalated`) |
| `region` | string | No | Filter cases by institution region/state |
| `category` | string | No | Case-insensitive partial filter by category |
| `from_date` | datetime | No | Cases received on or after timestamp |
| `to_date` | datetime | No | Cases received on or before timestamp |
| `overdue` | boolean | No | Filter cases by overdue status (`true`/`false`). Excludes disposed cases |
| `page` | integer | No | 1-based page index (Default `1`) |
| `page_size` | integer | No | Items per page (Default `20`, Max `100`) |

All case summary items dynamically expose computed SLA deadline indicators:
- `is_overdue`: `boolean` (true if past deadline and not disposed)
- `days_overdue`: `integer` (calendar days past due, 0 if not overdue)
- `is_approaching_deadline`: `boolean` (true if due within upcoming 48 hours)

---

### 3.5 Case Details & Timeline Action History

```http
GET /api/cases/{case_id}
```

Returns full dossier, nested institution details, and deterministically sorted chronological audit timeline.

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
  "is_overdue": false,
  "days_overdue": 0,
  "is_approaching_deadline": false,
  "created_at": "2026-10-04T10:00:00",
  "updated_at": "2026-10-21T10:00:00",
  "institution": {
    "institution_id": "DEMO-AICTE-001",
    "name": "Apex Institute of Technology & Research",
    "address": "Plot 14, Knowledge Park III, Greater Noida",
    "region": "Uttar Pradesh",
    "institution_type": "Engineering & Technology"
  },
  "action_history": []
}
```

---

### 3.6 Explicit Case-to-Case Link Retrieval

```http
GET /api/cases/{case_id}/links
```

Retrieves confirmed cross-bureau coordination relationships for a specific complaint case. The relationship is discovered bidirectionally (whether the requested case was recorded as primary or secondary in human review).

#### Query Rules
- **Confirmed Only**: Only formal determinations of `Coordination Required` are returned. Unreviewed algorithmic candidates (`Pending Review`), `Not Related`, or `Continue Independently` determinations are strictly excluded.
- **Safety Guarantee**: Original complaint records and their respective action histories remain 100% independent and intact without merging or data destruction.

#### Response (200 OK)
```json
{
  "case_id": "DEMO-CASE-001",
  "total_links": 1,
  "links": [
    {
      "link_id": 1,
      "case_id": "DEMO-CASE-001",
      "linked_case_id": "DEMO-CASE-002",
      "overlap_id": "OVL-DEMO-CASE-001-DEMO-CASE-002",
      "primary_case_id": "DEMO-CASE-001",
      "secondary_case_id": "DEMO-CASE-002",
      "decision": "Coordination Required",
      "status": "Coordination Required",
      "reviewer": "Dr. Ananya Roy (Joint Director)",
      "reviewed_at": "2026-10-24T14:30:00",
      "similarity_score": 0.88,
      "overlap_reason": "Concurrent capitation fee collection and unapproved intake expansion",
      "remarks": "Combined inquiry ordered under PGRC and Approval Bureau",
      "created_at": "2026-10-20T10:00:00",
      "linked_case_bureau": "Approval Bureau",
      "linked_case_status": "Under Process",
      "linked_case_category": "Unapproved Intake Expansion"
    }
  ]
}
```

#### Error Responses
- `404 Not Found`: Complaint case ID was not found in the registry.

```

---

### 3.6 Case Workflow & Partial Updates

```http
PATCH /api/cases/{case_id}
```

Performs partial workflow updates (status transitions, reassignment, statutory due date revisions). Atomically commits changes and appends an audit record to `CaseAction` in the same transaction.

#### Request Body
```json
{
  "status": "Under Process",
  "assigned_officer": "Dr. Sunita Rao (Deputy Director)",
  "due_date": "2026-11-20T10:00:00",
  "next_action": "Schedule inquiry hearing",
  "remarks": "Reassigned following regional redistribution"
}
```

#### Response (200 OK)
Returns complete refreshed `CaseDetailResponse` including updated action history.

#### Error Responses
- `404 Not Found`: Case ID does not exist.
- `422 Unprocessable Content`: Invalid status (must be one of: `Pending`, `Under Process`, `Disposed`, `Transferred`, `Escalated`).

---

### 3.7 Log Case Procedural Action

```http
POST /api/cases/{case_id}/actions
```

Appends an event to the case's chronological procedural timeline and updates the case's `last_action`, `next_action`, and status.

#### Request Body
```json
{
  "action_taken": "Show-cause notice served to Governing Body",
  "action_by": "Dr. S. K. Narayanan (PGRC)",
  "remarks": "Notice served via official speed post with 10-day compliance window",
  "next_action": "Await written response",
  "new_status": "Under Process"
}
```

#### Response (201 Created)
```json
{
  "id": 5,
  "case_id": "DEMO-CASE-001",
  "action_taken": "Show-cause notice served to Governing Body",
  "action_by": "Dr. S. K. Narayanan (PGRC)",
  "action_date": "2026-10-26T18:40:00",
  "remarks": "Notice served via official speed post with 10-day compliance window",
  "next_action": "Await written response",
  "previous_status": "Under Process",
  "new_status": "Under Process"
}
```

---

### 3.8 List & Filter Candidate Overlaps

```http
GET /api/overlaps
```

Reconciles candidate cross-bureau overlaps identified by Person 5's matching engine with persisted human review decisions in `CoordinationReview`.

#### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `search` | string | No | Search across institution name, ID, case IDs, summaries, and key signals |
| `bureau` | string | No | Filter by bureau involved (`PGRC`, `RB`, `AB`) |
| `status` | string | No | Filter by review status (`Pending Review`, `Coordination Required`, `Not Related`, `Further Review Required`) |
| `min_score` | float | No | Minimum score threshold (e.g. `80` or `0.80`) |
| `sort_by` | string | No | Sort order (`score_desc`, `score_asc`, `date_desc`, `date_asc`, `institution`) |

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": "OVL-DEMO-CASE-001-DEMO-CASE-002",
      "overlap_id": "OVL-DEMO-CASE-001-DEMO-CASE-002",
      "review_id": 1,
      "institutionId": "DEMO-AICTE-001",
      "institutionName": "Apex Institute of Technology & Research",
      "institutionRegion": "Uttar Pradesh",
      "caseAId": "DEMO-CASE-001",
      "caseBId": "DEMO-CASE-002",
      "caseABureau": "PGRC",
      "caseBBureau": "RB",
      "caseAStatus": "Under Process",
      "caseBStatus": "Under Process",
      "matchScore": 89,
      "similarity_score": 0.89,
      "status": "Pending Review",
      "summary": "Cross-bureau correlation (89%) detected between PGRC and RB regarding concurrent financial grievances.",
      "keySignals": [
        "Identical Institution Permanent ID (DEMO-AICTE-001)",
        "Cross-Bureau Concurrent Proceedings (PGRC vs RB)",
        "Correlated Allegation Keywords: cash, salary, fees"
      ],
      "matchReasons": [
        {
          "id": "sig-inst-DEMO-CASE-001-DEMO-CASE-002",
          "signalName": "Permanent Institution ID Match",
          "category": "Entity Identity",
          "score": 100.0,
          "description": "Both complaint proceedings are registered against institution ID 'DEMO-AICTE-001'."
        }
      ]
    }
  ],
  "total": 1,
  "pending_count": 1,
  "coordinated_count": 0
}
```

---

### 3.9 Single Overlap Dossier

```http
GET /api/overlaps/{overlap_id}
```

Accepts either canonical string ID (e.g., `OVL-DEMO-CASE-001-DEMO-CASE-002`) or integer review ID (e.g., `1`). Returns complete overlap evidence dossier and review history.

---

### 3.10 Submit Coordination Review Determination

```http
POST /api/overlaps/{overlap_id}/review
```

Records a statutory human review determination for a detected overlap pair. Updates the overlap state, records reviewer identity and justification remarks, and appends audit timeline actions to both referenced cases.

#### Request Body
```json
{
  "decision": "Coordination Required",
  "remarks": "Concurrent financial complaints warrant joint inquiry committee by combined PGRC and RB officers.",
  "reviewerName": "Dr. Ananya Roy (Joint Director)",
  "reviewerDesignation": "Senior Evaluation Committee",
  "reviewerEmail": "ananya.roy@aicte-india.org"
}
```

#### Allowed Decision Values
- `Coordination Required`
- `Continue Independently`
- `Not Related`
- `Further Review Required`

#### Safety & Human Control Guarantees
- Complaint cases are **never** automatically merged, deleted, or closed.
- A determination of `Not Related` marks the pair as resolved/independent and suppresses unreviewed alerts under `Pending Review`.
- Repeat reviews update the active determination while preserving a complete audit trail.

---

### 3.11 Cross-Bureau Dashboard Aggregate Statistics

```http
GET /api/dashboard
```

Computes live statistics directly from SQLite database records and the shared deadline service.

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
  "overlaps_awaiting_review": 1,
  "cases_approaching_deadline": 0,
  "bureau_wise_workload": [
    { "bureau": "PGRC", "case_count": 4 },
    { "bureau": "RB", "case_count": 3 },
    { "bureau": "Approval Bureau", "case_count": 2 }
  ],
  "status_distribution": [
    { "status": "Pending", "count": 2 },
    { "status": "Under Process", "count": 3 },
    { "status": "Disposed", "count": 2 },
    { "status": "Transferred", "count": 1 },
    { "status": "Escalated", "count": 1 }
  ],
  "region_wise_cases": [
    { "region": "Uttar Pradesh", "case_count": 4 },
    { "region": "Karnataka", "case_count": 1 }
  ],
  "recent_actions": [],
  "recent_overlaps": []
}
```

---

### 3.12 In-App Actionable Alert Feed

```http
GET /api/alerts
```

Returns a unified, real-time stream of prioritized, actionable alerts across AICTE bureaus.
Alerts are aggregated dynamically from:
1. **Overdue Cases**: Non-disposed cases past statutory SLA deadline.
2. **Approaching Deadlines**: Non-disposed cases expiring within the upcoming 48 hours.
3. **Overlaps Pending Review**: Candidate cross-bureau correlations with high similarity awaiting review.

All alerts are sorted strictly by urgency:
- Primary sort by severity: `CRITICAL` > `HIGH` > `MEDIUM` > `LOW`.
- Sub-sorting: overdue cases with more elapsed days appear first; approaching deadlines with fewer remaining hours appear first; pending reviews with higher similarity appear first.
- Disposed cases and cases with missing due dates never generate deadline alerts.
- When an overlap review is submitted (`Not Related`, `Coordination Required`, etc.), its pending alert is automatically suppressed.

#### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `alert_type` | string | No | Filter by alert category (`OVERDUE`, `APPROACHING_DEADLINE`, `PENDING_REVIEW`) |
| `severity` | string | No | Filter by priority severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) |
| `bureau` | string | No | Filter alerts by AICTE Bureau or Cell |
| `case_id` | string | No | Filter alerts by specific Complaint Case ID |
| `limit` | integer | No | Maximum alerts to return (Default `100`, Max `500`) |

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": "alert-overdue-DEMO-CASE-004",
      "alert_type": "OVERDUE",
      "severity": "CRITICAL",
      "title": "Case DEMO-CASE-004 Overdue",
      "message": "Case DEMO-CASE-004 (PGRC) for Apex Institute of Technology & Research is 8 days past statutory deadline.",
      "case_id": "DEMO-CASE-004",
      "overlap_id": null,
      "bureau": "PGRC",
      "institution_id": "DEMO-AICTE-001",
      "institution_name": "Apex Institute of Technology & Research",
      "due_date": "2026-10-18T10:00:00",
      "days_overdue": 8,
      "hours_remaining": null,
      "similarity_score": null,
      "created_at": "2026-09-18T10:00:00",
      "action_url": "/cases/DEMO-CASE-004"
    },
    {
      "id": "alert-pending-review-OVL-DEMO-CASE-001-DEMO-CASE-002",
      "alert_type": "PENDING_REVIEW",
      "severity": "HIGH",
      "title": "Overlap Awaiting Review: OVL-DEMO-CASE-001-DEMO-CASE-002",
      "message": "Cross-bureau correlation detected between DEMO-CASE-001 (PGRC) and DEMO-CASE-002 (Approval Bureau) for Apex Institute of Technology & Research (88% match).",
      "case_id": "DEMO-CASE-001",
      "overlap_id": "OVL-DEMO-CASE-001-DEMO-CASE-002",
      "bureau": "PGRC/Approval Bureau",
      "institution_id": "DEMO-AICTE-001",
      "institution_name": "Apex Institute of Technology & Research",
      "due_date": null,
      "days_overdue": null,
      "hours_remaining": null,
      "similarity_score": 0.88,
      "created_at": "2026-10-26T20:00:00",
      "action_url": "/overlaps/OVL-DEMO-CASE-001-DEMO-CASE-002"
    }
  ],
  "total": 2,
  "critical_count": 1,
  "high_count": 1,
  "medium_count": 0,
  "low_count": 0
}
```


---

## 4. Teammate Integration Specifications

### A. Person 5 Matching Engine
- **Module**: `backend/matching.py`
- **Signature**: `detect_overlaps(cases: list[dict]) -> list[dict]`
- **Stable ID Derivation**: `derive_stable_overlap_id(case_a_id: str, case_b_id: str) -> str`
- Deterministic canonical pair ordering guarantees stable identities across runs.

### B. Deadline Calculations
- **Module**: `backend/services/deadlines.py`
- Centralized calculation for `is_case_overdue` and `is_case_approaching_deadline` with timezone-safe UTC normalization.

### C. Frontend Compatibility
- Dual field serialization: models provide both `snake_case` (e.g. `primary_case_id`, `similarity_score`) and `camelCase` (e.g. `caseAId`, `matchScore`) fields to support React/Vite UI components without client-side transformation.
