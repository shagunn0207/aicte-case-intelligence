"""
AICTE Hierarchical Complaint Taxonomy & Domain Concept Engine.
Version: 1.0.0

Provides:
- 8 Configurable Parent Categories and structured Subcategories
- Canonical Issue Concepts with regex and token patterns, negative guards, and confidence
- Multi-label classification (a case may match zero, one, or multiple concepts)
- Explicit Unclassified / Unknown concept handling (no forced weak classifications)
- Cross-cutting attributes (alleged vs confirmed, recurring vs isolated, ongoing vs resolved)
- Explicit systemic nexus definitions across regulatory domains
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Set, Any, Optional, Tuple


TAXONOMY_VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# 1. Taxonomy Structure: Parent Categories & Subcategories
# ---------------------------------------------------------------------------

PARENT_CATEGORIES = {
    "FACULTY_EMPLOYMENT": "Faculty & Employment",
    "FEES_FINANCIAL": "Fees & Financial Compliance",
    "ADMISSIONS_QUOTA": "Admissions & Quota Compliance",
    "GOVERNANCE_REGULATORY": "Governance & Regulatory Compliance",
    "ACADEMIC_STUDENT": "Academic & Student Affairs",
    "STUDENT_WELFARE": "Student Welfare, Safety & Discipline",
    "INFRASTRUCTURE": "Infrastructure & Facilities",
    "ADMINISTRATION": "Institutional Administration",
}

# ---------------------------------------------------------------------------
# 2. Canonical Issue Concepts Definition
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class CanonicalConcept:
    concept_id: str
    display_name: str
    parent_category: str
    subcategory: str
    description: str
    patterns: Tuple[str, ...]
    guard_exclusions: Tuple[str, ...] = ()
    base_weight: float = 1.0


CANONICAL_CONCEPTS: Dict[str, CanonicalConcept] = {
    # --- 1. Faculty & Employment ---
    "faculty.salary_arrears": CanonicalConcept(
        concept_id="faculty.salary_arrears",
        display_name="Faculty Salary Arrears & Withholding",
        parent_category="FACULTY_EMPLOYMENT",
        subcategory="Salary & Compensation",
        description="Non-payment, delayed disbursement, or unlawful withholding of faculty salaries or 7th CPC arrears.",
        patterns=(
            r"\b(salary arrears|unpaid salary|salary non-payment|withholding of salary|salaries withheld)\b",
            r"\b(remuneration withheld|delay in salary|unpaid stipend|unpaid wages|arrears payment)\b",
            r"\b(7th cpc scale|cpc arrears|salary deductions unauthorized|honorarium pending)\b",
            r"\b(salary crunch|salaries not credited)\b",
        ),
        guard_exclusions=(r"\b(tuition fee|student deposit|caution money|admission fee)\b",),
    ),
    "faculty.ghost_faculty": CanonicalConcept(
        concept_id="faculty.ghost_faculty",
        display_name="Ghost Faculty & Biometric Evasion",
        parent_category="FACULTY_EMPLOYMENT",
        subcategory="Recruitment & Qualifications",
        description="Fictitious faculty roster, absentee professors, rented credentials, or evasion of biometric attendance.",
        patterns=(
            r"\b(ghost faculty|ghost professors?|absentee professors?|fake faculty)\b",
            r"\b(rented teachers?|proxy teachers?|biometric evasion|biometric tampering)\b",
            r"\b(fake faculty certificates?|fraudulent appointments?)\b",
        ),
        guard_exclusions=(r"\b(student biometric|student attendance)\b",),
    ),
    "faculty.certificate_retention": CanonicalConcept(
        concept_id="faculty.certificate_retention",
        display_name="Unlawful Retention of Faculty Certificates",
        parent_category="FACULTY_EMPLOYMENT",
        subcategory="Service Conditions & Harassment",
        description="Forced withholding of original academic and professional certificates of faculty members upon joining.",
        patterns=(
            r"\b(original certificates? withheld|withholding original certificates?)\b",
            r"\b(educational certificates? retained|service bond retention|surrender certificates?)\b",
        ),
        guard_exclusions=(r"\b(student original certificates?|student transfer certificate)\b",),
    ),
    "faculty.cadre_ratio_deficiency": CanonicalConcept(
        concept_id="faculty.cadre_ratio_deficiency",
        display_name="Cadre Ratio & Professor Shortage",
        parent_category="FACULTY_EMPLOYMENT",
        subcategory="Cadre Ratio & Workload",
        description="Failure to maintain mandatory AICTE Cadre Ratio (Professor : Associate Professor : Assistant Professor).",
        patterns=(
            r"\b(cadre ratio|cadre deficit|shortage of professors?|cadre audit)\b",
            r"\b(student[- ]to[- ]faculty ratio|sfr deficiency|inadequate regular faculty)\b",
        ),
    ),

    # --- 2. Fees & Financial Compliance ---
    "fees.capitation_charges": CanonicalConcept(
        concept_id="fees.capitation_charges",
        display_name="Unauthorized Capitation & Development Fees",
        parent_category="FEES_FINANCIAL",
        subcategory="Capitation & Unauthorized Charges",
        description="Demanding or extorting capitation fees, unauthorized development charges, or cash donations.",
        patterns=(
            r"\b(capitation fees?|unauthorized development fees?|cash donations?)\b",
            r"\b(cash collections?(?: from students)?|mandatory cash deposit|miscellaneous heads fee)\b",
            r"\b(unprescribed fee structure|illegal fee collection|exorbitant fee demands?)\b",
            r"\b(unrecorded fees?|unauthorized fees?|fees? without receipts?)\b",
        ),
        guard_exclusions=(r"\b(faculty salary|salary arrears)\b",),
    ),
    "fees.refund_dispute": CanonicalConcept(
        concept_id="fees.refund_dispute",
        display_name="Caution Money & Fee Refund Denial",
        parent_category="FEES_FINANCIAL",
        subcategory="Fee Refund Disputes",
        description="Refusal to refund tuition fees, security deposits, or caution money upon student withdrawal/transfer.",
        patterns=(
            r"\b(fee refunds? dispute|caution money refund|security deposit refund)\b",
            r"\b(refusal to refund|withholding refundable deposit|forfeiture of fees?)\b",
            r"\b(cancellation refund denied|non-refund of deposit|illegal retention of refundable)\b",
            r"\b(refundable (?:security )?deposits?|caution money)\b",
        ),
        guard_exclusions=(r"\b(salary arrears|remuneration)\b",),
    ),
    "fees.financial_misappropriation": CanonicalConcept(
        concept_id="fees.financial_misappropriation",
        display_name="Financial Misappropriation & Grant Diversion",
        parent_category="FEES_FINANCIAL",
        subcategory="Financial Misappropriation",
        description="Diversion or embezzlement of student fees, AICTE scheme funds, scholarships, or research grants.",
        patterns=(
            r"\b(financial misappropriation|diversion of funds|grant embezzlement)\b",
            r"\b(scholarship diversion|misappropriation of fees|fraudulent accounting)\b",
            r"\b(bank transaction ledgers? fraud|siphoning of funds)\b",
        ),
    ),

    # --- 3. Admissions & Quota Compliance ---
    "admissions.unapproved_intake": CanonicalConcept(
        concept_id="admissions.unapproved_intake",
        display_name="Unapproved Intake & Excess Admissions",
        parent_category="ADMISSIONS_QUOTA",
        subcategory="Unapproved Intake Expansion",
        description="Admitting students beyond approved AICTE seat intake or without statutory sanction.",
        patterns=(
            r"\b(unapproved intake|excess intake|admissions? beyond sanctioned seats?)\b",
            r"\b(excess admissions?|illegal seat increase|unauthorized intake expansion)\b",
            r"\b(sanctioned intake violation|unapproved division)\b",
            r"\b(beyond sanctioned (?:intake|seats?)|admit\w* (?:students )?(?:beyond|over) sanctioned)\b",
        ),
        guard_exclusions=(r"\b(hostel intake|canteen capacity)\b",),
    ),
    "admissions.quota_malpractice": CanonicalConcept(
        concept_id="admissions.quota_malpractice",
        display_name="Management & NRI Quota Malpractice",
        parent_category="ADMISSIONS_QUOTA",
        subcategory="Quota Violations",
        description="Irregularities, auctioning of seats, or fraud in management/NRI quota seat allotments.",
        patterns=(
            r"\b(management quota (fraud|malpractice|irregularit\w+))\b",
            r"\b(nri quota violations?|quota seats auctioning|bypassing merit list)\b",
        ),
    ),

    # --- 4. Governance & Regulatory Compliance ---
    "regulatory.unapproved_course": CanonicalConcept(
        concept_id="regulatory.unapproved_course",
        display_name="Unapproved Courses & Forged EOA",
        parent_category="GOVERNANCE_REGULATORY",
        subcategory="Approval & Affiliation Compliance",
        description="Offering academic courses without AICTE approval, forged Extension of Approval (EOA), or bogus affiliations.",
        patterns=(
            r"\b(unapproved course|courses? running without approval|unapproved program)\b",
            r"\b(forged eoa|extension of approval missing|bogus affiliation)\b",
            r"\b(unauthorized degrees?|lack of aicte recognition)\b",
        ),
    ),
    "regulatory.land_title_deficit": CanonicalConcept(
        concept_id="regulatory.land_title_deficit",
        display_name="Land Title, Lease & Zoning Encumbrance",
        parent_category="GOVERNANCE_REGULATORY",
        subcategory="Land & Title Encumbrance",
        description="Cadastral survey deficiency, disputed land lease deed, mortgage encumbrance, or inadequate campus acreage.",
        patterns=(
            r"\b(cadastral land survey|lease deed boundaries|land title deficiency)\b",
            r"\b(disputed land|encumbered campus land|inadequate land acreage)\b",
        ),
    ),
    "regulatory.inspection_noncompliance": CanonicalConcept(
        concept_id="regulatory.inspection_noncompliance",
        display_name="Regulatory Inspection Non-Compliance",
        parent_category="GOVERNANCE_REGULATORY",
        subcategory="Regulatory Audit & Inspection Findings",
        description="Failure to rectify deficiencies noted during surprise inspection, compliance review, or show-cause notices.",
        patterns=(
            r"\b(surprise (regulatory )?inspection revealed|inspection findings non-compliance)\b",
            r"\b(show-cause notice compliance failure|expert visit committee non-compliance)\b",
            r"\b(evasion of regulatory inspection|scrutiny committee adverse report)\b",
        ),
    ),

    # --- 5. Academic & Student Affairs ---
    "academic.exam_malpractice": CanonicalConcept(
        concept_id="academic.exam_malpractice",
        display_name="Examination Malpractice & Hall Ticket Withholding",
        parent_category="ACADEMIC_STUDENT",
        subcategory="Examination & Evaluation Malpractice",
        description="Withholding examination hall tickets to coerce payments, mass copying, or tampering with evaluations.",
        patterns=(
            r"\b(hall ticket (withheld|withholding|denial)|admit card denied)\b",
            r"\b(examination malpractice|mass copying|evaluation tampering)\b",
        ),
    ),
    "academic.certificate_withholding": CanonicalConcept(
        concept_id="academic.certificate_withholding",
        display_name="Student Marksheet & Degree Withholding",
        parent_category="ACADEMIC_STUDENT",
        subcategory="Credential Withholding",
        description="Withholding student original mark sheets, transfer certificates, or degree certificates.",
        patterns=(
            r"\b(withholding student marksheets?|degree certificates? withheld)\b",
            r"\b(transfer certificate withheld|migration certificate denied)\b",
        ),
    ),

    # --- 6. Student Welfare, Safety & Discipline ---
    "safety.ragging": CanonicalConcept(
        concept_id="safety.ragging",
        display_name="Anti-Ragging Violations & Inaction",
        parent_category="STUDENT_WELFARE",
        subcategory="Ragging Incidents",
        description="Physical or psychological ragging of students, hostel abuse, or failure of Anti-Ragging committee.",
        patterns=(
            r"\b(ragging incidents?|severe ragging|hostel ragging|harassment by seniors)\b",
            r"\b(anti-ragging committee (failure|inactive|neglect))\b",
        ),
    ),
    "safety.campus_harassment": CanonicalConcept(
        concept_id="safety.campus_harassment",
        display_name="Campus Safety & Workplace Harassment",
        parent_category="STUDENT_WELFARE",
        subcategory="Campus Safety & Harassment",
        description="Sexual harassment, lack of internal complaints committee (ICC), or unsafe campus environment.",
        patterns=(
            r"\b(campus harassment|sexual harassment|internal complaints committee inactive)\b",
            r"\b(workplace hostility|unsafe campus premises)\b",
        ),
    ),

    # --- 7. Infrastructure & Facilities ---
    "infrastructure.lab_safety": CanonicalConcept(
        concept_id="infrastructure.lab_safety",
        display_name="Laboratory & Workshop Safety Hazards",
        parent_category="INFRASTRUCTURE",
        subcategory="Laboratory & Workshop Safety",
        description="Deficient laboratory equipment, chemical hazards, lack of fire safety, or uncalibrated machinery.",
        patterns=(
            r"\b(laboratory safety|unsafe laboratory|chemical hazard|broken lab equipment)\b",
            r"\b(workshop safety machinery|fire extinguisher missing in lab)\b",
        ),
    ),
    "infrastructure.hostel_hygiene": CanonicalConcept(
        concept_id="infrastructure.hostel_hygiene",
        display_name="Hostel Mess Hygiene & Sanitation",
        parent_category="INFRASTRUCTURE",
        subcategory="Hostel & Mess Hygiene",
        description="Unhygienic hostel mess food, contaminated drinking water, or unsanitary living conditions.",
        patterns=(
            r"\b(hostel mess hygiene|unhygienic food|unhygienic water supply)\b",
            r"\b(contaminated drinking water|hostel sanitation issues)\b",
        ),
    ),
    "infrastructure.library_it": CanonicalConcept(
        concept_id="infrastructure.library_it",
        display_name="Library & IT Computer Lab Shortage",
        parent_category="INFRASTRUCTURE",
        subcategory="Library & IT Resources",
        description="Severe deficiency of library textbooks, electronic journals, or computer lab terminals.",
        patterns=(
            r"\b(shortage of reference textbooks|library deficiency|inadequate library)\b",
            r"\b(computer lab terminals shortage|internet bandwidth deficit)\b",
        ),
    ),

    # --- 8. Institutional Administration ---
    "admin.transportation": CanonicalConcept(
        concept_id="admin.transportation",
        display_name="Transportation Surcharge & Bus Issues",
        parent_category="ADMINISTRATION",
        subcategory="Transport & Logistics Grievances",
        description="Arbitrary transport fee hikes, dilapidated buses, or unsafe routing.",
        patterns=(
            r"\b(college bus route delay|transportation surcharge|bus breakdown)\b",
            r"\b(arbitrary bus fee|unsafe transport)\b",
        ),
    ),
}

# ---------------------------------------------------------------------------
# 3. Cross-Cutting Attributes Definitions
# ---------------------------------------------------------------------------

ALLEGATION_STATUS_PATTERNS = {
    "confirmed": [
        r"\b(confirmed|verified by committee|inspection confirmed|audit established|inquiry established)\b",
        r"\b(proven finding|official determination|conclusively established)\b",
    ],
    "corroborated": [
        r"\b(preliminary inquiry corroborated|records corroborate|multiple testimonies match)\b",
        r"\b(bank ledgers confirm|evidence supports)\b",
    ],
    "under_investigation": [
        r"\b(under process|inquiry initiated|explanation sought|show-cause notice served)\b",
        r"\b(scrutiny underway|fact-finding committee appointed|joint inspection ordered)\b",
    ],
    "disputed": [
        r"\b(management denied|disputed by principal|rebutted by institution|contradictory accounts)\b",
    ],
    "alleged": [
        r"\b(alleging|alleged|petition regarding|complainant states|grievance submitted)\b",
        r"\b(purported|claimed by student|claimed by faculty)\b",
    ],
}

TEMPORAL_STATUS_PATTERNS = {
    "ongoing": [
        r"\b(ongoing|continuous|currently persisting|continuous cash collections|still pending)\b",
        r"\b(repeatedly occurring|continuous non-payment)\b",
    ],
    "historic": [
        r"\b(previous academic year|in 202[0-3]|former student|past tenure|historic grievance)\b",
    ],
    "resolved": [
        r"\b(disposed|resolved|settled|refund processed|arrears disbursed)\b",
    ],
}

RECURRENCE_PATTERNS = {
    "recurring": [
        r"\b(recurring|repeated|multiple instances|habitual|systemic)\b",
        r"\b(batch after batch|continuous for \d+ months)\b",
    ],
    "isolated": [
        r"\b(one-off|isolated incident|single instance|first-time complaint)\b",
    ],
}

# ---------------------------------------------------------------------------
# 4. Explicit Systemic Nexus Definitions
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SystemicNexusRule:
    nexus_id: str
    concept_a: str
    concept_b: str
    nexus_name: str
    rationale: str
    required_keywords: Tuple[str, ...]
    compatibility_score: float = 0.85


SYSTEMIC_NEXUS_RULES: List[SystemicNexusRule] = [
    SystemicNexusRule(
        nexus_id="NEXUS-FIN-01",
        concept_a="fees.capitation_charges",
        concept_b="faculty.salary_arrears",
        nexus_name="Systemic Cash Siphoning & Salary Withholding",
        rationale=(
            "Simultaneous off-the-books student cash fee collections alongside faculty salary withholding "
            "points to institutional financial manipulation or fund diversion."
        ),
        required_keywords=("cash", "salary", "collection", "crunch", "funds", "withheld"),
        compatibility_score=0.88,
    ),
    SystemicNexusRule(
        nexus_id="NEXUS-ADM-01",
        concept_a="admissions.unapproved_intake",
        concept_b="fees.capitation_charges",
        nexus_name="Commercialised Unapproved Admissions",
        rationale=(
            "Unsanctioned excess student intake collected alongside development fees indicates "
            "systemic commercial seat racket violating approved AICTE matrices."
        ),
        required_keywords=("intake", "seats", "capitation", "cash", "unapproved", "admission"),
        compatibility_score=0.90,
    ),
    SystemicNexusRule(
        nexus_id="NEXUS-REG-01",
        concept_a="regulatory.unapproved_course",
        concept_b="admissions.unapproved_intake",
        nexus_name="Unapproved Course Intake Operation",
        rationale=(
            "Offering unapproved courses coupled with intake violations shows systematic operation "
            "outside statutory AICTE jurisdiction."
        ),
        required_keywords=("unapproved", "approval", "intake", "course", "extension", "eoa"),
        compatibility_score=0.92,
    ),
    SystemicNexusRule(
        nexus_id="NEXUS-FAC-01",
        concept_a="faculty.ghost_faculty",
        concept_b="faculty.cadre_ratio_deficiency",
        nexus_name="Fictitious Compliance with Faculty Norms",
        rationale=(
            "Deploying absentee/ghost faculty to mask statutory cadre ratio deficits during regulatory inspections."
        ),
        required_keywords=("ghost", "cadre", "inspection", "ratio", "absentee", "biometric"),
        compatibility_score=0.91,
    ),
]

# ---------------------------------------------------------------------------
# 5. Data Structures for Classified Cases
# ---------------------------------------------------------------------------

@dataclass
class CaseDomainProfile:
    case_id: str
    matched_concepts: List[CanonicalConcept] = field(default_factory=list)
    matched_concept_ids: List[str] = field(default_factory=list)
    parent_categories: List[str] = field(default_factory=list)
    subcategories: List[str] = field(default_factory=list)
    allegation_status: str = "alleged"
    temporal_status: str = "ongoing"
    recurrence: str = "unknown"
    is_unclassified: bool = False
    specific_entities: Dict[str, List[str]] = field(default_factory=dict)
    confidence: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "matched_concept_ids": self.matched_concept_ids,
            "parent_categories": self.parent_categories,
            "subcategories": self.subcategories,
            "allegation_status": self.allegation_status,
            "temporal_status": self.temporal_status,
            "recurrence": self.recurrence,
            "is_unclassified": self.is_unclassified,
            "confidence": round(self.confidence, 2),
        }


# ---------------------------------------------------------------------------
# 6. Classifier Functions
# ---------------------------------------------------------------------------

def _clean(val: Any) -> str:
    if val is None:
        return ""
    if not isinstance(val, str):
        val = str(val)
    s = val.strip()
    return "" if s.lower() == "none" else s


def extract_allegation_status(text: str, default: str = "alleged") -> str:
    """Extracts status: confirmed, corroborated, under_investigation, disputed, or alleged."""
    t = text.lower()
    for status_key, patterns in ALLEGATION_STATUS_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, t):
                return status_key
    return default


def extract_temporal_status(text: str, default: str = "ongoing") -> str:
    """Extracts temporal scope: ongoing, historic, or resolved."""
    t = text.lower()
    for temp_key, patterns in TEMPORAL_STATUS_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, t):
                return temp_key
    return default


def extract_recurrence(text: str, default: str = "unknown") -> str:
    """Extracts whether issue is recurring, isolated, or unknown."""
    t = text.lower()
    for rec_key, patterns in RECURRENCE_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, t):
                return rec_key
    return default


def extract_specific_entities(text: str) -> Dict[str, List[str]]:
    """
    Extracts distinct incident identifiers like departments, academic batches,
    or academic years to detect distinct incidents within the same institution.
    """
    entities: Dict[str, List[str]] = {"departments": [], "years": [], "amounts": []}
    t = text.lower()

    # Department patterns
    depts = re.findall(
        r"\b(computer science|mechanical|civil|electrical|electronics|information technology|b\.?tech|m\.?tech|mba|mca)\b",
        t
    )
    if depts:
        entities["departments"] = sorted(list(set(depts)))

    # Year patterns (e.g., 2022, 2023, 2024, 2025, 3rd year)
    years = re.findall(r"\b(202[0-9]|\b[1-4](?:st|nd|rd|th)\s*year)\b", t)
    if years:
        entities["years"] = sorted(list(set(years)))

    # Monetary amounts (e.g., Rs. 65,000, 4-month salary)
    amounts = re.findall(r"(?:rs\.?|inr)\s*[\d,]+|\b\d+[- ]month salary\b", t)
    if amounts:
        entities["amounts"] = sorted(list(set(amounts)))

    return entities


def classify_case(case_dict: Dict[str, Any]) -> CaseDomainProfile:
    """
    Multi-label classification of a case into canonical issue concepts.
    Combines category, description, and action history without discarding unclassified text.
    """
    case_id = str(case_dict.get("case_id") or "UNKNOWN")
    cat = _clean(case_dict.get("category"))
    desc = _clean(case_dict.get("description"))
    last_act = _clean(case_dict.get("last_action"))
    next_act = _clean(case_dict.get("next_action"))

    # Also incorporate action history text if available
    actions_text = ""
    action_history = case_dict.get("action_history") or []
    if isinstance(action_history, list):
        for act in action_history:
            if isinstance(act, dict):
                actions_text += " " + _clean(act.get("action_taken")) + " " + _clean(act.get("remarks"))

    full_narrative = f"{cat} {desc} {last_act} {next_act} {actions_text}".strip().lower()

    matched: List[CanonicalConcept] = []
    matched_ids: List[str] = []
    parent_cats: Set[str] = set()
    subcats: Set[str] = set()

    for concept_id, concept in CANONICAL_CONCEPTS.items():
        # Check guard exclusions first
        excluded = False
        for guard in concept.guard_exclusions:
            # Only trigger exclusion if the guard term is present AND no strong explicit pattern matches
            if re.search(guard, full_narrative):
                # If guard term is present, we require an exact pattern match
                pass

        # Check positive patterns
        has_match = False
        for pat in concept.patterns:
            if re.search(pat, full_narrative):
                has_match = True
                break

        if has_match:
            # Verify guard exclusions
            for guard in concept.guard_exclusions:
                if re.search(guard, full_narrative):
                    # Check if the text is predominantly about the excluded topic
                    # Example: If complaint is about caution money refund, exclude faculty salary arrears
                    if concept_id == "faculty.salary_arrears" and re.search(r"\b(caution money|tuition fee|student deposit)\b", full_narrative):
                        if not re.search(r"\b(faculty|professor|remuneration|cpc)\b", full_narrative):
                            has_match = False
                            break
                    elif concept_id == "fees.capitation_charges" and re.search(r"\b(salary arrears|remuneration)\b", full_narrative):
                        if not re.search(r"\b(student|capitation|hall ticket|development fee)\b", full_narrative):
                            has_match = False
                            break

        if has_match:
            matched.append(concept)
            matched_ids.append(concept_id)
            parent_cats.add(PARENT_CATEGORIES.get(concept.parent_category, concept.parent_category))
            subcats.add(concept.subcategory)

    # Cross-cutting attributes
    allegation_status = extract_allegation_status(full_narrative)
    temporal_status = extract_temporal_status(full_narrative)
    recurrence = extract_recurrence(full_narrative)
    specific_entities = extract_specific_entities(full_narrative)

    is_unclassified = (len(matched) == 0)
    confidence = 0.90 if len(matched) == 1 else (0.80 if len(matched) > 1 else 0.0)

    # If unclassified, retain original category as parent category fallback
    if is_unclassified and cat:
        parent_cats.add(cat)

    return CaseDomainProfile(
        case_id=case_id,
        matched_concepts=matched,
        matched_concept_ids=matched_ids,
        parent_categories=sorted(list(parent_cats)),
        subcategories=sorted(list(subcats)),
        allegation_status=allegation_status,
        temporal_status=temporal_status,
        recurrence=recurrence,
        is_unclassified=is_unclassified,
        specific_entities=specific_entities,
        confidence=confidence,
    )


# ---------------------------------------------------------------------------
# 7. Relationship & Issue Similarity Evaluation
# ---------------------------------------------------------------------------

@dataclass
class IssueSimilarityAssessment:
    shared_concept_ids: List[str]
    shared_concept_names: List[str]
    shared_parent_categories: List[str]
    shared_subcategories: List[str]
    systemic_nexus: Optional[SystemicNexusRule]
    issue_similarity_score: float  # 0.0 - 1.0 (do they concern the same regulatory issue?)
    is_same_concept: bool
    is_same_parent_category: bool
    is_cross_category_nexus: bool
    summary_explanation: str


def evaluate_issue_similarity(
    profile_a: CaseDomainProfile,
    profile_b: CaseDomainProfile
) -> IssueSimilarityAssessment:
    """
    Evaluates whether Case A and Case B concern the same regulatory issue type,
    separating topic similarity from whether they are part of the same incident.
    """
    shared_concepts = list(set(profile_a.matched_concept_ids).intersection(profile_b.matched_concept_ids))
    shared_parents = list(set(profile_a.parent_categories).intersection(profile_b.parent_categories))
    shared_subs = list(set(profile_a.subcategories).intersection(profile_b.subcategories))

    shared_names = [
        CANONICAL_CONCEPTS[cid].display_name
        for cid in shared_concepts
        if cid in CANONICAL_CONCEPTS
    ]

    is_same_concept = len(shared_concepts) > 0
    is_same_parent = len(shared_parents) > 0

    # Check explicit systemic nexus if concepts differ
    systemic_nexus: Optional[SystemicNexusRule] = None
    if not is_same_concept:
        for rule in SYSTEMIC_NEXUS_RULES:
            a_has_1 = rule.concept_a in profile_a.matched_concept_ids
            b_has_2 = rule.concept_b in profile_b.matched_concept_ids
            a_has_2 = rule.concept_b in profile_a.matched_concept_ids
            b_has_1 = rule.concept_a in profile_b.matched_concept_ids

            if (a_has_1 and b_has_2) or (a_has_2 and b_has_1):
                systemic_nexus = rule
                break

    is_cross_nexus = (systemic_nexus is not None)

    # Score calculation
    if is_same_concept:
        score = 0.95
        summary = f"Shared canonical regulatory issue: {', '.join(shared_names)}."
    elif is_cross_nexus and systemic_nexus:
        score = systemic_nexus.compatibility_score
        summary = f"Cross-domain systemic nexus detected: '{systemic_nexus.nexus_name}' ({systemic_nexus.rationale})."
    elif len(shared_subs) > 0:
        score = 0.70
        summary = f"Aligned regulatory subcategory: {', '.join(shared_subs)}."
    elif is_same_parent:
        score = 0.45
        summary = f"Shared broad parent domain: {', '.join(shared_parents)}."
    else:
        score = 0.10
        summary = "Disparate regulatory domains with no recognized systemic nexus."

    return IssueSimilarityAssessment(
        shared_concept_ids=shared_concepts,
        shared_concept_names=shared_names,
        shared_parent_categories=shared_parents,
        shared_subcategories=shared_subs,
        systemic_nexus=systemic_nexus,
        issue_similarity_score=score,
        is_same_concept=is_same_concept,
        is_same_parent_category=is_same_parent,
        is_cross_category_nexus=is_cross_nexus,
        summary_explanation=summary,
    )
