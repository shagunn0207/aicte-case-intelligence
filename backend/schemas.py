from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field, model_validator


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = "ok"


# ---------------------------------------------------------
# Action History & Coordination Review (Shared Schemas)
# ---------------------------------------------------------
class CaseActionSchema(BaseModel):
    id: int
    case_id: str
    action_taken: str
    action_by: str
    action_date: datetime
    remarks: Optional[str] = None
    next_action: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    document_ref: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def extract_document_ref(cls, data: Any) -> Any:
        import re
        remarks = None
        if isinstance(data, dict):
            remarks = data.get("remarks")
            if remarks and "[Document Ref:" in remarks:
                m = re.search(r"\[Document Ref:\s*([^\]]+)\]", remarks)
                if m:
                    data.setdefault("document_ref", m.group(1).strip())
        elif hasattr(data, "remarks"):
            remarks = getattr(data, "remarks", None)
            if remarks and "[Document Ref:" in remarks:
                m = re.search(r"\[Document Ref:\s*([^\]]+)\]", remarks)
                if m:
                    # Return as dict with document_ref populated
                    return {
                        "id": getattr(data, "id"),
                        "case_id": getattr(data, "case_id"),
                        "action_taken": getattr(data, "action_taken"),
                        "action_by": getattr(data, "action_by"),
                        "action_date": getattr(data, "action_date"),
                        "remarks": remarks,
                        "next_action": getattr(data, "next_action", None),
                        "previous_status": getattr(data, "previous_status", None),
                        "new_status": getattr(data, "new_status", None),
                        "document_ref": m.group(1).strip()
                    }
        return data


class CaseActionCreate(BaseModel):
    action_taken: str
    action_by: Optional[str] = "Reviewing Officer"
    remarks: Optional[str] = None
    next_action: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    document_ref: Optional[str] = Field(None, alias="document_reference")
    document_reference: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class CaseUpdate(BaseModel):
    status: Optional[str] = None
    assigned_officer: Optional[str] = None
    last_action: Optional[str] = None
    next_action: Optional[str] = None
    due_date: Optional[datetime] = None
    action_by: Optional[str] = None
    action_taken: Optional[str] = None
    remarks: Optional[str] = None
    document_ref: Optional[str] = Field(None, alias="document_reference")
    document_reference: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class OverlapItem(BaseModel):
    review_id: Optional[int] = None
    primary_case_id: str
    secondary_case_id: str
    similarity_score: Optional[float] = None
    overlap_reason: Optional[str] = None
    status: str = "Pending Review"
    detected_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CoordinationReviewSubmission(BaseModel):
    decision: str
    remarks: str
    reviewer_name: Optional[str] = Field(None, alias="reviewerName")
    reviewer_designation: Optional[str] = Field(None, alias="reviewerDesignation")
    reviewer_email: Optional[str] = Field(None, alias="reviewerEmail")
    priority_action: Optional[bool] = Field(False, alias="priorityAction")

    model_config = ConfigDict(populate_by_name=True)


class OverlapDetailResponse(BaseModel):
    id: str
    overlap_id: str
    review_id: Optional[int] = None
    institution_id: str
    institution_name: str
    institutionId: Optional[str] = None
    institutionName: Optional[str] = None
    institution_region: Optional[str] = None
    institutionRegion: Optional[str] = None
    institution_city: Optional[str] = None
    institutionCity: Optional[str] = None
    primary_case_id: str
    secondary_case_id: str
    case_a_id: str
    case_b_id: str
    caseAId: Optional[str] = None
    caseBId: Optional[str] = None
    case_a_bureau: str
    case_b_bureau: str
    caseABureau: Optional[str] = None
    caseBBureau: Optional[str] = None
    case_a_status: str
    case_b_status: str
    caseAStatus: Optional[str] = None
    caseBStatus: Optional[str] = None
    similarity_score: float
    match_score: int
    matchScore: Optional[int] = None
    summary: Optional[str] = None
    key_signals: List[str] = Field(default_factory=list)
    keySignals: List[str] = Field(default_factory=list)
    match_reasons: List[dict] = Field(default_factory=list)
    matchReasons: List[dict] = Field(default_factory=list)
    overlap_reason: Optional[str] = None
    status: str = "Pending Review"
    detected_date: Optional[str] = None
    detectedDate: Optional[str] = None
    last_updated: Optional[str] = None
    lastUpdated: Optional[str] = None
    reviewer_decision: Optional[str] = None
    reviewer_remarks: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_history: List[dict] = Field(default_factory=list)
    reviewHistory: List[dict] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def populate_mirrored_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            primary = data.get("primary_case_id") or data.get("case_a_id") or data.get("caseAId")
            secondary = data.get("secondary_case_id") or data.get("case_b_id") or data.get("caseBId")
            inst_id = data.get("institution_id") or data.get("institutionId")
            inst_name = data.get("institution_name") or data.get("institutionName")
            inst_reg = data.get("institution_region") or data.get("institutionRegion")
            inst_city = data.get("institution_city") or data.get("institutionCity")
            bur_a = data.get("case_a_bureau") or data.get("caseABureau")
            bur_b = data.get("case_b_bureau") or data.get("caseBBureau")
            st_a = data.get("case_a_status") or data.get("caseAStatus")
            st_b = data.get("case_b_status") or data.get("caseBStatus")
            m_score = data.get("match_score") if data.get("match_score") is not None else data.get("matchScore")
            if m_score is None and data.get("similarity_score") is not None:
                m_score = int(round(float(data["similarity_score"]) * 100))
            sim_score = data.get("similarity_score")
            if sim_score is None and m_score is not None:
                sim_score = round(m_score / 100.0, 2)

            signals = data.get("key_signals") or data.get("keySignals") or []
            reasons = data.get("match_reasons") or data.get("matchReasons") or []
            history = data.get("review_history") or data.get("reviewHistory") or []
            det_date = data.get("detected_date") or data.get("detectedDate")
            last_up = data.get("last_updated") or data.get("lastUpdated")

            data["primary_case_id"] = primary
            data["secondary_case_id"] = secondary
            data["case_a_id"] = primary
            data["case_b_id"] = secondary
            data["caseAId"] = primary
            data["caseBId"] = secondary
            data["institution_id"] = inst_id
            data["institutionId"] = inst_id
            data["institution_name"] = inst_name
            data["institutionName"] = inst_name
            data["institution_region"] = inst_reg
            data["institutionRegion"] = inst_reg
            data["institution_city"] = inst_city
            data["institutionCity"] = inst_city
            data["case_a_bureau"] = bur_a
            data["caseABureau"] = bur_a
            data["case_b_bureau"] = bur_b
            data["caseBBureau"] = bur_b
            data["case_a_status"] = st_a
            data["caseAStatus"] = st_a
            data["case_b_status"] = st_b
            data["caseBStatus"] = st_b
            data["match_score"] = m_score if m_score is not None else 80
            data["matchScore"] = m_score if m_score is not None else 80
            data["similarity_score"] = sim_score if sim_score is not None else 0.80
            data["key_signals"] = signals
            data["keySignals"] = signals
            data["match_reasons"] = reasons
            data["matchReasons"] = reasons
            data["review_history"] = history
            data["reviewHistory"] = history
            data["detected_date"] = det_date
            data["detectedDate"] = det_date
            data["last_updated"] = last_up
            data["lastUpdated"] = last_up
        return data


class OverlapListResponse(BaseModel):
    items: List[OverlapDetailResponse]
    total: int
    pending_count: int = 0
    coordinated_count: int = 0


# ---------------------------------------------------------
# Institution Schemas
# ---------------------------------------------------------
class InstitutionBase(BaseModel):
    institution_id: str
    name: str
    region: str


class InstitutionListItem(InstitutionBase):
    case_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class InstitutionListResponse(BaseModel):
    items: List[InstitutionListItem]
    page: int
    page_size: int
    total: int


class InstitutionSimple(BaseModel):
    institution_id: str
    name: str
    address: str
    region: str
    institution_type: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Complaint Case Schemas
# ---------------------------------------------------------
class CaseSummary(BaseModel):
    case_id: str
    institution_id: str
    category: str
    description: str
    bureau: str
    status: str
    assigned_officer: str
    received_date: datetime
    due_date: datetime
    last_action: Optional[str] = None
    next_action: Optional[str] = None
    last_action_at: Optional[datetime] = None
    is_overdue: Optional[bool] = None
    days_overdue: Optional[int] = None
    is_approaching_deadline: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def compute_overdue_flags(self) -> "CaseSummary":
        from backend.services.deadlines import (
            is_case_overdue,
            get_days_overdue,
            is_case_approaching_deadline
        )
        if self.is_overdue is None:
            self.is_overdue = is_case_overdue(self.due_date, self.status)
        if self.days_overdue is None:
            self.days_overdue = get_days_overdue(self.due_date, self.status)
        if self.is_approaching_deadline is None:
            self.is_approaching_deadline = is_case_approaching_deadline(self.due_date, self.status)
        return self


# ---------------------------------------------------------
# Case-to-Case Linking Schemas (Explicit & Auditable)
# ---------------------------------------------------------
class CaseLinkItem(BaseModel):
    link_id: int
    case_id: str
    linked_case_id: str
    overlap_id: str
    primary_case_id: str
    secondary_case_id: str
    decision: str
    status: str
    reviewer: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    similarity_score: Optional[float] = None
    overlap_reason: Optional[str] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    linked_case_bureau: Optional[str] = None
    linked_case_status: Optional[str] = None
    linked_case_category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CaseLinksResponse(BaseModel):
    case_id: str
    total_links: int
    links: List[CaseLinkItem]
    items: List[CaseLinkItem] = Field(default_factory=list)

    @model_validator(mode="after")
    def sync_items(self) -> "CaseLinksResponse":
        if not self.items and self.links:
            self.items = self.links
        return self


# ---------------------------------------------------------
# In-App Actionable Alert Schemas
# ---------------------------------------------------------
class AlertItem(BaseModel):
    id: str
    alert_type: str  # "OVERDUE", "APPROACHING_DEADLINE", "PENDING_REVIEW"
    severity: str    # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    title: str
    message: str
    case_id: Optional[str] = None
    overlap_id: Optional[str] = None
    bureau: Optional[str] = None
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    due_date: Optional[datetime] = None
    days_overdue: Optional[int] = None
    hours_remaining: Optional[float] = None
    similarity_score: Optional[float] = None
    created_at: Optional[datetime] = None
    action_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AlertListResponse(BaseModel):
    items: List[AlertItem]
    total: int
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0



class CaseListItem(CaseSummary):
    institution_name: Optional[str] = None
    region: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CaseListResponse(BaseModel):
    items: List[CaseSummary]
    page: int
    page_size: int
    total: int


class CaseDetailResponse(CaseSummary):
    created_at: datetime
    updated_at: datetime
    institution: Optional[InstitutionSimple] = None
    action_history: List[CaseActionSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Institution 360° Profile
# ---------------------------------------------------------
class InstitutionProfileResponse(BaseModel):
    institution_id: str
    name: str
    address: str
    region: str
    institution_type: Optional[str] = None
    case_count: int
    created_at: datetime
    associated_cases: List[CaseSummary]

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Dashboard Statistics
# ---------------------------------------------------------
class BureauWorkload(BaseModel):
    bureau: str
    case_count: int


class StatusDistribution(BaseModel):
    status: str
    count: int


class RegionWiseCases(BaseModel):
    region: str
    case_count: int


class DashboardStatsResponse(BaseModel):
    total_cases: int
    pending_cases: int
    under_process_cases: int
    disposed_cases: int
    transferred_cases: int
    escalated_cases: int
    overdue_cases: int
    potential_overlaps: int
    overlaps_awaiting_review: int = 0
    cases_approaching_deadline: int = 0
    bureau_wise_workload: List[BureauWorkload]
    status_distribution: List[StatusDistribution]
    region_wise_cases: List[RegionWiseCases]
    recent_actions: List[CaseActionSchema] = Field(default_factory=list)
    recent_overlaps: List[OverlapItem] = Field(default_factory=list)
