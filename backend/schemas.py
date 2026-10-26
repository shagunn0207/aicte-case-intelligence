from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


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

    model_config = ConfigDict(from_attributes=True)


class OverlapItem(BaseModel):
    review_id: Optional[int] = None
    primary_case_id: str
    secondary_case_id: str
    similarity_score: Optional[float] = None
    overlap_reason: Optional[str] = None
    status: str = "Pending Review"
    detected_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


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
    bureau_wise_workload: List[BureauWorkload]
    status_distribution: List[StatusDistribution]
    region_wise_cases: List[RegionWiseCases]
    recent_actions: List[CaseActionSchema] = Field(default_factory=list)
    recent_overlaps: List[OverlapItem] = Field(default_factory=list)
