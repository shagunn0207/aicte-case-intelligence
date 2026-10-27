"""
Benchmark generator for AICTE Case Intelligence Ground-Truth Evaluation.
Generates 35 diverse, privacy-safe, realistic case pairs with explicit taxonomy labels,
relationship labels, rationales, and evaluation splits (dev_calibration vs held_out_test).
"""

import json
from pathlib import Path

PAIRS = [
    # -------------------------------------------------------------------------
    # Bucket 1: Paraphrased / Same Canonical Concept (Related) - 6 pairs
    # -------------------------------------------------------------------------
    {
        "pair_id": "BENCH-01",
        "split": "held_out_test",
        "bucket": "paraphrased_same_concept",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-PARA-01A",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Faculty petition regarding unpaid salary arrears for five consecutive months and delayed disbursement of 7th CPC scale.",
            "received_date": "2026-08-10T10:00:00",
            "status": "Under Process",
            "last_action": "Explanation sought from Principal regarding pending faculty remuneration ledgers",
        },
        "case_b": {
            "case_id": "RB-PARA-01B",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Surprise regulatory inspection revealed systemic non-payment of faculty wages and prolonged remuneration withheld by management.",
            "received_date": "2026-08-25T14:30:00",
            "status": "Under Process",
            "last_action": "Joint scrutiny notice served to governing body for non-disbursement of approved pay scales",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "ground_truth_label": "Related",
        "rationale": "Both proceedings directly address identical ongoing non-payment of faculty salaries across PGRC and Regulation Bureau.",
        "expected_evidence": ["Shared canonical concept 'faculty.salary_arrears'", "Identical permanent institution ID", "Cross-bureau correlation"],
        "counter_evidence_or_contradiction": "Different vocabulary used (salary arrears vs remuneration withheld)."
    },
    {
        "pair_id": "BENCH-02",
        "split": "held_out_test",
        "bucket": "paraphrased_same_concept",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-PARA-02A",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Final year students forced to pay unauthorized development fee of Rs 45,000 in cash before issuance of examination hall ticket.",
            "received_date": "2026-07-12T11:00:00",
            "status": "Under Process",
            "last_action": "Show-cause notice served to Dean Examinations",
        },
        "case_b": {
            "case_id": "RB-PARA-02B",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Audit team flagged extortion of mandatory cash donations and unapproved miscellaneous charges prior to semester examinations.",
            "received_date": "2026-07-28T09:30:00",
            "status": "Under Process",
            "last_action": "Seizure of unofficial cash collection receipts from accounts branch",
        },
        "case_a_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges", "academic.exam_malpractice"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges"]
        },
        "ground_truth_label": "Related",
        "rationale": "Identical extortion of cash donations tied to semester exams at the same Pune institution.",
        "expected_evidence": ["Canonical concept 'fees.capitation_charges'", "Exam fee link", "Corroborated by receipt seizure"],
        "counter_evidence_or_contradiction": "None."
    },
    {
        "pair_id": "BENCH-03",
        "split": "dev_calibration",
        "bucket": "paraphrased_same_concept",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-PARA-03A",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Allegation of fictitious faculty roster and rented teachers presented during AICTE committee inspection visit.",
            "received_date": "2026-09-02T10:00:00",
            "status": "Pending",
            "last_action": "Complaint registered on portal",
        },
        "case_b": {
            "case_id": "AB-PARA-03B",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "Approval Bureau",
            "category": "Approval Compliance",
            "description": "Biometric inspection by Approval Bureau confirmed absentee professors and ghost faculty listed on mandatory disclosure portal.",
            "received_date": "2026-09-18T15:00:00",
            "status": "Under Process",
            "last_action": "Biometric attendance logs impounded by AICTE visiting officer",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Recruitment & Qualifications",
            "canonical_concepts": ["faculty.ghost_faculty"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Recruitment & Qualifications",
            "canonical_concepts": ["faculty.ghost_faculty"]
        },
        "ground_truth_label": "Related",
        "rationale": "Allegation of rented teachers directly verified by Approval Bureau impounding biometric logs.",
        "expected_evidence": ["Shared concept 'faculty.ghost_faculty'", "Action finding confirmation"],
        "counter_evidence_or_contradiction": "PGRC is individual grievance, Approval Bureau is institutional scrutiny."
    },
    {
        "pair_id": "BENCH-04",
        "split": "held_out_test",
        "bucket": "paraphrased_same_concept",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-PARA-04A",
            "institution_id": "INST-BLR-04",
            "institution_name": "Silicon City Engineering Academy, Bengaluru",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Student withdrew after round 1 counseling but administration is refusing caution money refund and withholding refundable deposit.",
            "received_date": "2026-06-15T10:00:00",
            "status": "Under Process",
            "last_action": "Notice served to Registrar for fee refund compliance",
        },
        "case_b": {
            "case_id": "RB-PARA-04B",
            "institution_id": "INST-BLR-04",
            "institution_name": "Silicon City Engineering Academy, Bengaluru",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Multiple student representations alleging unlawful forfeiture of fees and non-refund of deposit upon seat cancellation.",
            "received_date": "2026-06-28T12:00:00",
            "status": "Under Process",
            "last_action": "Hearing scheduled with institution treasurer",
        },
        "case_a_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Fee Refund Disputes",
            "canonical_concepts": ["fees.refund_dispute"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Fee Refund Disputes",
            "canonical_concepts": ["fees.refund_dispute"]
        },
        "ground_truth_label": "Related",
        "rationale": "Both complaints highlight systemic institutional refusal to process caution money and fee refunds.",
        "expected_evidence": ["Canonical concept 'fees.refund_dispute'", "Same admission cycle"],
        "counter_evidence_or_contradiction": "Case A is single student, Case B is collective representation."
    },
    {
        "pair_id": "BENCH-05",
        "split": "held_out_test",
        "bucket": "paraphrased_same_concept",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "AB-PARA-05A",
            "institution_id": "INST-TN-05",
            "institution_name": "Chola Polytechnic College, Chennai",
            "bureau": "Approval Bureau",
            "category": "Approval Compliance",
            "description": "Institute running unapproved courses in cyber security without AICTE approval or sanctioned syllabus.",
            "received_date": "2026-05-10T10:00:00",
            "status": "Under Process",
            "last_action": "Show-cause notice for offering unapproved diplomas",
        },
        "case_b": {
            "case_id": "RB-PARA-05B",
            "institution_id": "INST-TN-05",
            "institution_name": "Chola Polytechnic College, Chennai",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Inspection team discovered courses running without approval and forged EOA displayed on campus notice board.",
            "received_date": "2026-05-24T16:00:00",
            "status": "Under Process",
            "last_action": "Criminal complaint recommended for forged Extension of Approval",
        },
        "case_a_taxonomy": {
            "parent_category": "Governance & Regulatory Compliance",
            "subcategory": "Approval & Affiliation Compliance",
            "canonical_concepts": ["regulatory.unapproved_course"]
        },
        "case_b_taxonomy": {
            "parent_category": "Governance & Regulatory Compliance",
            "subcategory": "Approval & Affiliation Compliance",
            "canonical_concepts": ["regulatory.unapproved_course"]
        },
        "ground_truth_label": "Related",
        "rationale": "Directly connected regulatory investigation into forged AICTE approval and unauthorized course operation.",
        "expected_evidence": ["Canonical concept 'regulatory.unapproved_course'", "Severe regulatory violation"],
        "counter_evidence_or_contradiction": "None."
    },
    {
        "pair_id": "BENCH-06",
        "split": "dev_calibration",
        "bucket": "paraphrased_same_concept",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-PARA-06A",
            "institution_id": "INST-RJ-06",
            "institution_name": "Marwar Engineering College, Jaipur",
            "bureau": "PGRC",
            "category": "Student Welfare",
            "description": "First-year engineering students subjected to severe ragging in senior boys hostel block with warden complicity.",
            "received_date": "2026-09-12T20:00:00",
            "status": "Under Process",
            "last_action": "National Anti-Ragging Helpline report forwarded to Principal",
        },
        "case_b": {
            "case_id": "RB-PARA-06B",
            "institution_id": "INST-RJ-06",
            "institution_name": "Marwar Engineering College, Jaipur",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Urgent inquiry into anti-ragging committee inactive status following multiple senior harassment complaints in campus hostels.",
            "received_date": "2026-09-20T11:00:00",
            "status": "Under Process",
            "last_action": "Statutory inquiry committee constituted by AICTE Regional Office",
        },
        "case_a_taxonomy": {
            "parent_category": "Student Welfare, Safety & Discipline",
            "subcategory": "Ragging Incidents",
            "canonical_concepts": ["safety.ragging"]
        },
        "case_b_taxonomy": {
            "parent_category": "Student Welfare, Safety & Discipline",
            "subcategory": "Ragging Incidents",
            "canonical_concepts": ["safety.ragging"]
        },
        "ground_truth_label": "Related",
        "rationale": "PGRC individual ragging report corroborated by RB inquiry into non-functioning Anti-Ragging committee.",
        "expected_evidence": ["Shared concept 'safety.ragging'", "Hostel incident context"],
        "counter_evidence_or_contradiction": "None."
    },

    # -------------------------------------------------------------------------
    # Bucket 2: Cross-Bureau Systemic Nexus (Related) - 6 pairs
    # -------------------------------------------------------------------------
    {
        "pair_id": "BENCH-07",
        "split": "held_out_test",
        "bucket": "cross_bureau_systemic_nexus",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-NEX-01A",
            "institution_id": "INST-MP-07",
            "institution_name": "Malwa Institute of Technology, Indore",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Students forced to deposit unauthorized development fee in cash to college society bank account without official receipt.",
            "received_date": "2026-08-01T10:00:00",
            "status": "Under Process",
            "last_action": "Notice issued regarding unapproved cash collections",
        },
        "case_b": {
            "case_id": "RB-NEX-01B",
            "institution_id": "INST-MP-07",
            "institution_name": "Malwa Institute of Technology, Indore",
            "bureau": "RB",
            "category": "Faculty Grievance",
            "description": "Faculty salaries withheld for 4 months with management citing institutional financial crunch and depleted bank ledgers.",
            "received_date": "2026-08-15T14:00:00",
            "status": "Under Process",
            "last_action": "Financial audit ordered to track student cash collections versus salary disbursements",
        },
        "case_a_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "ground_truth_label": "Related",
        "rationale": "Systemic nexus: Off-the-books student cash extortion co-occurring with artificial salary withholding for financial siphoning.",
        "expected_evidence": ["Systemic nexus rule 'NEXUS-FIN-01'", "Cross-bureau correlation", "Action mentions tracking collections vs salaries"],
        "counter_evidence_or_contradiction": "Different complainant groups (students vs faculty)."
    },
    {
        "pair_id": "BENCH-08",
        "split": "held_out_test",
        "bucket": "cross_bureau_systemic_nexus",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "AB-NEX-02A",
            "institution_id": "INST-HYD-08",
            "institution_name": "Deccan College of Technology, Hyderabad",
            "bureau": "Approval Bureau",
            "category": "Approval Compliance",
            "description": "Institute admitted 180 students against sanctioned intake limit of 120 in Computer Science, creating unapproved intake expansion.",
            "received_date": "2026-09-01T10:00:00",
            "status": "Under Process",
            "last_action": "Sanctioned seat matrix discrepancy flagged to state entrance authority",
        },
        "case_b": {
            "case_id": "PGRC-NEX-02B",
            "institution_id": "INST-HYD-08",
            "institution_name": "Deccan College of Technology, Hyderabad",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Extortion of Rs 1,50,000 cash donation under management quota for admission into Computer Science department.",
            "received_date": "2026-09-10T12:00:00",
            "status": "Under Process",
            "last_action": "Student statement recorded regarding capitation fee payment for extra seat",
        },
        "case_a_taxonomy": {
            "parent_category": "Admissions & Quota Compliance",
            "subcategory": "Unapproved Intake Expansion",
            "canonical_concepts": ["admissions.unapproved_intake"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges", "admissions.quota_malpractice"]
        },
        "ground_truth_label": "Related",
        "rationale": "Commercial admission racket: Unapproved intake created to collect cash capitation fees in Computer Science.",
        "expected_evidence": ["Systemic nexus 'NEXUS-ADM-01'", "Identical Computer Science department mentioned", "Synchronous timing"],
        "counter_evidence_or_contradiction": "Categories differ (Approval compliance vs Fee irregularities)."
    },
    {
        "pair_id": "BENCH-09",
        "split": "dev_calibration",
        "bucket": "cross_bureau_systemic_nexus",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "RB-NEX-03A",
            "institution_id": "INST-KL-09",
            "institution_name": "Malabar Engineering College, Kozhikode",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Cadre ratio audit revealed severe shortage of professors and associate professors in mechanical division.",
            "received_date": "2026-04-10T11:00:00",
            "status": "Under Process",
            "last_action": "Deficiency report issued on cadre ratio",
        },
        "case_b": {
            "case_id": "PGRC-NEX-03B",
            "institution_id": "INST-KL-09",
            "institution_name": "Malabar Engineering College, Kozhikode",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Faculty whistle-blower revealed ghost faculty credentials uploaded to AICTE portal to cover up cadre deficit.",
            "received_date": "2026-04-22T15:00:00",
            "status": "Under Process",
            "last_action": "Physical verification ordered for listed mechanical professors",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Cadre Ratio & Workload",
            "canonical_concepts": ["faculty.cadre_ratio_deficiency"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Recruitment & Qualifications",
            "canonical_concepts": ["faculty.ghost_faculty"]
        },
        "ground_truth_label": "Related",
        "rationale": "Ghost professors utilized to deceptively conceal Cadre Ratio audit deficiencies.",
        "expected_evidence": ["Systemic nexus 'NEXUS-FAC-01'", "Mechanical division alignment", "Cross-bureau correlation"],
        "counter_evidence_or_contradiction": "None."
    },
    {
        "pair_id": "BENCH-10",
        "split": "held_out_test",
        "bucket": "cross_bureau_systemic_nexus",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-NEX-04A",
            "institution_id": "INST-GJ-10",
            "institution_name": "Gujarat Technological Campus, Ahmedabad",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Students coerced into paying Rs 50,000 in cash under miscellaneous development heads; hall ticket withheld upon refusal.",
            "received_date": "2026-10-01T10:00:00",
            "status": "Under Process",
            "last_action": "Notice served to Director",
        },
        "case_b": {
            "case_id": "RB-NEX-04B",
            "institution_id": "INST-GJ-10",
            "institution_name": "Gujarat Technological Campus, Ahmedabad",
            "bureau": "RB",
            "category": "Faculty Grievance",
            "description": "Faculty salaries not credited for 3 months; administration claiming empty bank transaction ledgers.",
            "received_date": "2026-10-12T14:00:00",
            "status": "Under Process",
            "last_action": "Bank transaction ledgers requisitioned by Regional Office",
        },
        "case_a_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges", "academic.exam_malpractice"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "ground_truth_label": "Related",
        "rationale": "Simultaneous student cash extortion and faculty salary withholding indicating diversion of funds.",
        "expected_evidence": ["Systemic nexus 'NEXUS-FIN-01'", "Same institutional campus", "Concurrent October 2026 proceedings"],
        "counter_evidence_or_contradiction": "None."
    },
    {
        "pair_id": "BENCH-11",
        "split": "held_out_test",
        "bucket": "cross_bureau_systemic_nexus",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "AB-NEX-05A",
            "institution_id": "INST-WB-11",
            "institution_name": "Bengal Engineering Institute, Kolkata",
            "bureau": "Approval Bureau",
            "category": "Approval Compliance",
            "description": "Approval Bureau flagged unapproved intake expansion with 90 admissions in artificial intelligence division.",
            "received_date": "2026-07-05T11:00:00",
            "status": "Under Process",
            "last_action": "Sanctioned intake records requisitioned",
        },
        "case_b": {
            "case_id": "PGRC-NEX-05B",
            "institution_id": "INST-WB-11",
            "institution_name": "Bengal Engineering Institute, Kolkata",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Parents report unapproved development fees collected in cash for newly started artificial intelligence division.",
            "received_date": "2026-07-15T15:00:00",
            "status": "Under Process",
            "last_action": "Receipts submitted by parent committee",
        },
        "case_a_taxonomy": {
            "parent_category": "Admissions & Quota Compliance",
            "subcategory": "Unapproved Intake Expansion",
            "canonical_concepts": ["admissions.unapproved_intake"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges"]
        },
        "ground_truth_label": "Related",
        "rationale": "Directly connected commercialization of unapproved artificial intelligence intake through cash fees.",
        "expected_evidence": ["Systemic nexus 'NEXUS-ADM-01'", "Specific entity 'artificial intelligence' match"],
        "counter_evidence_or_contradiction": "None."
    },
    {
        "pair_id": "BENCH-12",
        "split": "dev_calibration",
        "bucket": "cross_bureau_systemic_nexus",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "AB-NEX-06A",
            "institution_id": "INST-PB-12",
            "institution_name": "Punjab Polytech & Engineering, Ludhiana",
            "bureau": "Approval Bureau",
            "category": "Approval Compliance",
            "description": "Offering unapproved courses in robotics automation without mandatory AICTE recognition.",
            "received_date": "2026-08-01T10:00:00",
            "status": "Under Process",
            "last_action": "De-affiliation recommendation issued",
        },
        "case_b": {
            "case_id": "RB-NEX-06B",
            "institution_id": "INST-PB-12",
            "institution_name": "Punjab Polytech & Engineering, Ludhiana",
            "bureau": "RB",
            "category": "Admission Malpractice",
            "description": "Mass admissions beyond sanctioned seats in unauthorized robotics stream without state entrance exam.",
            "received_date": "2026-08-14T12:00:00",
            "status": "Under Process",
            "last_action": "Notice served to Governing Body",
        },
        "case_a_taxonomy": {
            "parent_category": "Governance & Regulatory Compliance",
            "subcategory": "Approval & Affiliation Compliance",
            "canonical_concepts": ["regulatory.unapproved_course"]
        },
        "case_b_taxonomy": {
            "parent_category": "Admissions & Quota Compliance",
            "subcategory": "Unapproved Intake Expansion",
            "canonical_concepts": ["admissions.unapproved_intake"]
        },
        "ground_truth_label": "Related",
        "rationale": "Operating an unapproved course and running unauthorized admissions in that exact course.",
        "expected_evidence": ["Systemic nexus 'NEXUS-REG-01'", "Course 'robotics' entity match"],
        "counter_evidence_or_contradiction": "None."
    },

    # -------------------------------------------------------------------------
    # Bucket 3: Same Institution, Clearly Different Regulatory Domain (Not Related) - 5 pairs
    # -------------------------------------------------------------------------
    {
        "pair_id": "BENCH-13",
        "split": "held_out_test",
        "bucket": "same_inst_different_domain",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-DIFF-01A",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "PGRC",
            "category": "Infrastructure Deficiencies",
            "description": "Hostel mess hygiene is deficient with unhygienic water supply and contaminated drinking water in girls hostel block.",
            "received_date": "2026-08-10T10:00:00",
            "status": "Pending",
            "last_action": "Forwarded to campus welfare officer",
        },
        "case_b": {
            "case_id": "AB-DIFF-01B",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "Approval Bureau",
            "category": "Regulatory Audit",
            "description": "Deficiency in cadastral land survey lease deed boundaries and encumbered title for campus expansion wing.",
            "received_date": "2026-08-15T14:00:00",
            "status": "Under Process",
            "last_action": "Title deed documents scrutinized by legal cell",
        },
        "case_a_taxonomy": {
            "parent_category": "Infrastructure & Facilities",
            "subcategory": "Hostel & Mess Hygiene",
            "canonical_concepts": ["infrastructure.hostel_hygiene"]
        },
        "case_b_taxonomy": {
            "parent_category": "Governance & Regulatory Compliance",
            "subcategory": "Land & Title Encumbrance",
            "canonical_concepts": ["regulatory.land_title_deficit"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Hostel food/water sanitation and cadastral land survey encumbrance are completely independent operational matters.",
        "expected_evidence": ["Different parent categories", "No canonical concept overlap", "No systemic nexus"],
        "counter_evidence_or_contradiction": "Shares same institution ID (must NOT trigger candidate match)."
    },
    {
        "pair_id": "BENCH-14",
        "split": "held_out_test",
        "bucket": "same_inst_different_domain",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-DIFF-02A",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "PGRC",
            "category": "Student Welfare",
            "description": "Hostel ragging incident involving senior students in hostel block B late night.",
            "received_date": "2026-07-02T10:00:00",
            "status": "Under Process",
            "last_action": "Anti-ragging squad dispatched",
        },
        "case_b": {
            "case_id": "RB-DIFF-02B",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Surprise regulatory inspection revealed lack of fire extinguisher and chemical hazards in chemistry laboratory safety.",
            "received_date": "2026-07-20T11:00:00",
            "status": "Under Process",
            "last_action": "Lab safety audit report submitted",
        },
        "case_a_taxonomy": {
            "parent_category": "Student Welfare, Safety & Discipline",
            "subcategory": "Ragging Incidents",
            "canonical_concepts": ["safety.ragging"]
        },
        "case_b_taxonomy": {
            "parent_category": "Infrastructure & Facilities",
            "subcategory": "Laboratory & Workshop Safety",
            "canonical_concepts": ["infrastructure.lab_safety"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Student hostel ragging and chemistry lab fire extinguishers are entirely unrelated regulatory concerns.",
        "expected_evidence": ["Different categories", "No concept overlap"],
        "counter_evidence_or_contradiction": "Same Pune institution."
    },
    {
        "pair_id": "BENCH-15",
        "split": "dev_calibration",
        "bucket": "same_inst_different_domain",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-DIFF-03A",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "PGRC",
            "category": "Institutional Administration",
            "description": "College bus route delay and arbitrary transportation surcharge imposed on day-scholar students.",
            "received_date": "2026-09-05T10:00:00",
            "status": "Pending",
            "last_action": "Transport manager summoned",
        },
        "case_b": {
            "case_id": "RB-DIFF-03B",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Surprise inspection confirmed fake faculty certificates and ghost teachers listed on portal.",
            "received_date": "2026-09-15T15:00:00",
            "status": "Under Process",
            "last_action": "Faculty roster impounded",
        },
        "case_a_taxonomy": {
            "parent_category": "Institutional Administration",
            "subcategory": "Transport & Logistics Grievances",
            "canonical_concepts": ["admin.transportation"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Recruitment & Qualifications",
            "canonical_concepts": ["faculty.ghost_faculty"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Bus route delays and ghost faculty certificates are completely disparate administrative domains.",
        "expected_evidence": ["Zero concept overlap", "Zero systemic nexus"],
        "counter_evidence_or_contradiction": "Same Greater Noida college."
    },
    {
        "pair_id": "BENCH-16",
        "split": "held_out_test",
        "bucket": "same_inst_different_domain",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-DIFF-04A",
            "institution_id": "INST-BLR-04",
            "institution_name": "Silicon City Engineering Academy, Bengaluru",
            "bureau": "PGRC",
            "category": "Infrastructure Deficiencies",
            "description": "Shortage of reference textbooks in reading room and library deficiency in mechanical department.",
            "received_date": "2026-06-10T10:00:00",
            "status": "Pending",
            "last_action": "Librarian requested to purchase books",
        },
        "case_b": {
            "case_id": "AB-DIFF-04B",
            "institution_id": "INST-BLR-04",
            "institution_name": "Silicon City Engineering Academy, Bengaluru",
            "bureau": "Approval Bureau",
            "category": "Admission Malpractice",
            "description": "Admission beyond sanctioned intake seats under management quota in computer science department.",
            "received_date": "2026-06-25T14:00:00",
            "status": "Under Process",
            "last_action": "Scrutiny of seat matrix",
        },
        "case_a_taxonomy": {
            "parent_category": "Infrastructure & Facilities",
            "subcategory": "Library & IT Resources",
            "canonical_concepts": ["infrastructure.library_it"]
        },
        "case_b_taxonomy": {
            "parent_category": "Admissions & Quota Compliance",
            "subcategory": "Unapproved Intake Expansion",
            "canonical_concepts": ["admissions.unapproved_intake"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Mechanical library books and Computer Science excess intake share no incident or regulatory nexus.",
        "expected_evidence": ["Distinct categories", "No conceptual relationship"],
        "counter_evidence_or_contradiction": "Same Bengaluru institution."
    },
    {
        "pair_id": "BENCH-17",
        "split": "held_out_test",
        "bucket": "same_inst_different_domain",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-DIFF-05A",
            "institution_id": "INST-TN-05",
            "institution_name": "Chola Polytechnic College, Chennai",
            "bureau": "PGRC",
            "category": "Student Welfare",
            "description": "Workplace hostility and campus safety concerns regarding lack of security guards near girls hostel.",
            "received_date": "2026-05-02T10:00:00",
            "status": "Pending",
            "last_action": "Notice served to security agency",
        },
        "case_b": {
            "case_id": "RB-DIFF-05B",
            "institution_id": "INST-TN-05",
            "institution_name": "Chola Polytechnic College, Chennai",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Cadre ratio audit revealed severe shortage of regular assistant professors across polytechnic diploma streams.",
            "received_date": "2026-05-18T16:00:00",
            "status": "Under Process",
            "last_action": "Cadre deficit penalty proposed",
        },
        "case_a_taxonomy": {
            "parent_category": "Student Welfare, Safety & Discipline",
            "subcategory": "Campus Safety & Harassment",
            "canonical_concepts": ["safety.campus_harassment"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Cadre Ratio & Workload",
            "canonical_concepts": ["faculty.cadre_ratio_deficiency"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Campus security guard deployment and polytechnic faculty cadre ratio audit are wholly independent.",
        "expected_evidence": ["Different parents", "Zero concept overlap"],
        "counter_evidence_or_contradiction": "Same Chennai polytechnic."
    },

    # -------------------------------------------------------------------------
    # Bucket 4: Hard Negatives: Same Inst + Same Category, but Separate Incidents - 5 pairs
    # -------------------------------------------------------------------------
    {
        "pair_id": "BENCH-18",
        "split": "held_out_test",
        "bucket": "same_inst_same_category_hard_negative",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-HARD-01A",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Faculty petition regarding unpaid salary arrears in Civil Engineering department for the 2023 academic year.",
            "received_date": "2024-03-10T10:00:00",
            "status": "Disposed",
            "last_action": "Disposed upon payment of 2023 arrears as per settlement agreement",
        },
        "case_b": {
            "case_id": "PGRC-HARD-01B",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Newly recruited Computer Science assistant professors complaining about delayed stipend and salary arrears for 2026 batch.",
            "received_date": "2026-08-15T14:00:00",
            "status": "Under Process",
            "last_action": "Verification of 2026 computer science faculty appointment orders",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Different incidents separated by 2.5 years, distinct departments (Civil 2023 settled vs CS 2026 new), and Case A is already disposed.",
        "expected_evidence": ["Different departments (Civil vs Computer Science)", "Temporal gap > 800 days", "Case A disposed"],
        "counter_evidence_or_contradiction": "Shares same institution ID and same canonical concept (salary arrears)."
    },
    {
        "pair_id": "BENCH-19",
        "split": "held_out_test",
        "bucket": "same_inst_same_category_hard_negative",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-HARD-02A",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Student seeking caution money refund after seat cancellation in M.Tech 2022 batch. Deposit withheld.",
            "received_date": "2023-01-15T10:00:00",
            "status": "Disposed",
            "last_action": "Resolved: Cheque issued to student in Feb 2023",
        },
        "case_b": {
            "case_id": "PGRC-HARD-02B",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "B.Tech 2026 batch student alleging withholding refundable deposit following transfer to government college.",
            "received_date": "2026-07-20T12:00:00",
            "status": "Under Process",
            "last_action": "Notice served for B.Tech transfer refund",
        },
        "case_a_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Fee Refund Disputes",
            "canonical_concepts": ["fees.refund_dispute"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Fee Refund Disputes",
            "canonical_concepts": ["fees.refund_dispute"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Isolated student refund disputes occurring 3.5 years apart in completely different degree programs (M.Tech 2022 vs B.Tech 2026).",
        "expected_evidence": ["Massive temporal gap", "Different degree programs", "Case A disposed long ago"],
        "counter_evidence_or_contradiction": "Identical concept 'fees.refund_dispute' and same college."
    },
    {
        "pair_id": "BENCH-20",
        "split": "dev_calibration",
        "bucket": "same_inst_same_category_hard_negative",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-HARD-03A",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "PGRC",
            "category": "Student Welfare",
            "description": "Ragging incident reported in Junior Boys Hostel block in November 2023. Anti-ragging committee suspended 4 seniors.",
            "received_date": "2023-11-10T10:00:00",
            "status": "Disposed",
            "last_action": "Culprits rusticated and FIR lodged in Nov 2023",
        },
        "case_b": {
            "case_id": "PGRC-HARD-03B",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "PGRC",
            "category": "Student Welfare",
            "description": "Fresh ragging complaint in Girls Hostel block in September 2026 involving second year seniors.",
            "received_date": "2026-09-08T18:00:00",
            "status": "Under Process",
            "last_action": "Fact-finding committee inspecting Girls Hostel",
        },
        "case_a_taxonomy": {
            "parent_category": "Student Welfare, Safety & Discipline",
            "subcategory": "Ragging Incidents",
            "canonical_concepts": ["safety.ragging"]
        },
        "case_b_taxonomy": {
            "parent_category": "Student Welfare, Safety & Discipline",
            "subcategory": "Ragging Incidents",
            "canonical_concepts": ["safety.ragging"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Distinct, separated ragging incidents (Boys hostel 2023 disposed vs Girls hostel 2026 fresh inquiry).",
        "expected_evidence": ["Different hostel facilities (Boys vs Girls)", "34-month time gap", "Case A closed with FIR"],
        "counter_evidence_or_contradiction": "Same college and same concept (ragging)."
    },
    {
        "pair_id": "BENCH-21",
        "split": "held_out_test",
        "bucket": "same_inst_same_category_hard_negative",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-HARD-04A",
            "institution_id": "INST-MP-07",
            "institution_name": "Malwa Institute of Technology, Indore",
            "bureau": "PGRC",
            "category": "Infrastructure Deficiencies",
            "description": "Broken lab equipment and uncalibrated machinery in mechanical workshop reported by 2024 diploma batch.",
            "received_date": "2024-02-10T10:00:00",
            "status": "Disposed",
            "last_action": "New lathe machines installed in April 2024",
        },
        "case_b": {
            "case_id": "PGRC-HARD-04B",
            "institution_id": "INST-MP-07",
            "institution_name": "Malwa Institute of Technology, Indore",
            "bureau": "PGRC",
            "category": "Infrastructure Deficiencies",
            "description": "Lack of fire safety and chemical hazard in chemistry laboratory safety for first year 2026 batch.",
            "received_date": "2026-08-10T11:00:00",
            "status": "Under Process",
            "last_action": "Fire safety officer inspection pending",
        },
        "case_a_taxonomy": {
            "parent_category": "Infrastructure & Facilities",
            "subcategory": "Laboratory & Workshop Safety",
            "canonical_concepts": ["infrastructure.lab_safety"]
        },
        "case_b_taxonomy": {
            "parent_category": "Infrastructure & Facilities",
            "subcategory": "Laboratory & Workshop Safety",
            "canonical_concepts": ["infrastructure.lab_safety"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Mechanical workshop lathe machinery in 2024 (settled) vs First year Chemistry lab chemical hazard in 2026.",
        "expected_evidence": ["Different laboratories (Mechanical vs Chemistry)", "Disposed status of Case A", "2.5 year gap"],
        "counter_evidence_or_contradiction": "Both classified as infrastructure.lab_safety."
    },
    {
        "pair_id": "BENCH-22",
        "split": "held_out_test",
        "bucket": "same_inst_same_category_hard_negative",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-HARD-05A",
            "institution_id": "INST-HYD-08",
            "institution_name": "Deccan College of Technology, Hyderabad",
            "bureau": "PGRC",
            "category": "Admission Malpractice",
            "description": "Irregularity in MBA management quota admissions regarding cut-off rank in 2023 session.",
            "received_date": "2023-09-01T10:00:00",
            "status": "Disposed",
            "last_action": "Clarification provided by state entrance authority in Oct 2023",
        },
        "case_b": {
            "case_id": "PGRC-HARD-05B",
            "institution_id": "INST-HYD-08",
            "institution_name": "Deccan College of Technology, Hyderabad",
            "bureau": "PGRC",
            "category": "Admission Malpractice",
            "description": "Excess intake and unapproved admissions in B.Tech Artificial Intelligence division for 2026 session.",
            "received_date": "2026-09-01T12:00:00",
            "status": "Under Process",
            "last_action": "Scrutiny of AI seat matrix",
        },
        "case_a_taxonomy": {
            "parent_category": "Admissions & Quota Compliance",
            "subcategory": "Quota Violations",
            "canonical_concepts": ["admissions.quota_malpractice"]
        },
        "case_b_taxonomy": {
            "parent_category": "Admissions & Quota Compliance",
            "subcategory": "Unapproved Intake Expansion",
            "canonical_concepts": ["admissions.unapproved_intake"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Different academic programs (MBA 2023 vs B.Tech AI 2026), 3-year separation, distinct subcategories.",
        "expected_evidence": ["Different programs (MBA vs B.Tech)", "3-year interval", "Case A resolved"],
        "counter_evidence_or_contradiction": "Same Hyderabad institution."
    },

    # -------------------------------------------------------------------------
    # Bucket 5: Similar Wording, Different Institutions (Not Related) - 4 pairs
    # -------------------------------------------------------------------------
    {
        "pair_id": "BENCH-23",
        "split": "held_out_test",
        "bucket": "similar_wording_different_inst",
        "institution_relationship": "different_institution",
        "case_a": {
            "case_id": "PGRC-DIFFINST-01A",
            "institution_id": "INST-A-PUNE",
            "institution_name": "College Alpha, Pune",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Faculty petition regarding unpaid salary arrears, non-payment of 7th CPC scale, and biometric evasion.",
            "received_date": "2026-08-10T10:00:00",
            "status": "Pending",
            "last_action": "Notice served to College Alpha",
        },
        "case_b": {
            "case_id": "PGRC-DIFFINST-01B",
            "institution_id": "INST-B-DELHI",
            "institution_name": "College Beta, Delhi",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Faculty petition regarding unpaid salary arrears, non-payment of 7th CPC scale, and biometric evasion.",
            "received_date": "2026-08-12T14:00:00",
            "status": "Pending",
            "last_action": "Notice served to College Beta",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears", "faculty.ghost_faculty"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears", "faculty.ghost_faculty"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Identical boilerplate complaint filed against two separate legal entities in Pune and Delhi.",
        "expected_evidence": ["Different institution Permanent IDs", "No institutional co-occurrence"],
        "counter_evidence_or_contradiction": "100% lexical wording similarity."
    },
    {
        "pair_id": "BENCH-24",
        "split": "dev_calibration",
        "bucket": "similar_wording_different_inst",
        "institution_relationship": "different_institution",
        "case_a": {
            "case_id": "PGRC-DIFFINST-02A",
            "institution_id": "INST-X-JAIPUR",
            "institution_name": "Jaipur Institute of Tech",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Student grievance regarding mandatory collection of unauthorized development fees and capitation fee in cash.",
            "received_date": "2026-09-01T10:00:00",
            "status": "Pending",
            "last_action": "Notice served",
        },
        "case_b": {
            "case_id": "RB-DIFFINST-02B",
            "institution_id": "INST-Y-CHENNAI",
            "institution_name": "Chennai Academy of Tech",
            "bureau": "RB",
            "category": "Fee Irregularities",
            "description": "Student grievance regarding mandatory collection of unauthorized development fees and capitation fee in cash.",
            "received_date": "2026-09-05T12:00:00",
            "status": "Under Process",
            "last_action": "Inspection ordered",
        },
        "case_a_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Completely distinct institutions across different states.",
        "expected_evidence": ["Distinct Permanent Institution IDs"],
        "counter_evidence_or_contradiction": "Identical complaint wording."
    },
    {
        "pair_id": "BENCH-25",
        "split": "held_out_test",
        "bucket": "similar_wording_different_inst",
        "institution_relationship": "different_institution",
        "case_a": {
            "case_id": "PGRC-DIFFINST-03A",
            "institution_id": "INST-KOL-01",
            "institution_name": "Calcutta Polytech",
            "bureau": "PGRC",
            "category": "Student Welfare",
            "description": "Severe ragging incident in senior boys hostel block with junior students being tortured.",
            "received_date": "2026-08-20T10:00:00",
            "status": "Under Process",
            "last_action": "FIR lodged",
        },
        "case_b": {
            "case_id": "PGRC-DIFFINST-03B",
            "institution_id": "INST-MUM-02",
            "institution_name": "Bombay Institute of Engineering",
            "bureau": "PGRC",
            "category": "Student Welfare",
            "description": "Severe ragging incident in senior boys hostel block with junior students being tortured.",
            "received_date": "2026-08-22T11:00:00",
            "status": "Under Process",
            "last_action": "FIR lodged",
        },
        "case_a_taxonomy": {
            "parent_category": "Student Welfare, Safety & Discipline",
            "subcategory": "Ragging Incidents",
            "canonical_concepts": ["safety.ragging"]
        },
        "case_b_taxonomy": {
            "parent_category": "Student Welfare, Safety & Discipline",
            "subcategory": "Ragging Incidents",
            "canonical_concepts": ["safety.ragging"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Separate institutions in Kolkata and Mumbai.",
        "expected_evidence": ["Distinct institutions"],
        "counter_evidence_or_contradiction": "Identical wording."
    },
    {
        "pair_id": "BENCH-26",
        "split": "held_out_test",
        "bucket": "similar_wording_different_inst",
        "institution_relationship": "different_institution",
        "case_a": {
            "case_id": "AB-DIFFINST-04A",
            "institution_id": "INST-BHOPAL",
            "institution_name": "Bhopal Engineering College",
            "bureau": "Approval Bureau",
            "category": "Approval Compliance",
            "description": "Offering unapproved courses running without approval and forged extension of approval displayed.",
            "received_date": "2026-07-10T10:00:00",
            "status": "Under Process",
            "last_action": "Show-cause notice",
        },
        "case_b": {
            "case_id": "AB-DIFFINST-04B",
            "institution_id": "INST-LUCKNOW",
            "institution_name": "Lucknow Polytech College",
            "bureau": "Approval Bureau",
            "category": "Approval Compliance",
            "description": "Offering unapproved courses running without approval and forged extension of approval displayed.",
            "received_date": "2026-07-15T10:00:00",
            "status": "Under Process",
            "last_action": "Show-cause notice",
        },
        "case_a_taxonomy": {
            "parent_category": "Governance & Regulatory Compliance",
            "subcategory": "Approval & Affiliation Compliance",
            "canonical_concepts": ["regulatory.unapproved_course"]
        },
        "case_b_taxonomy": {
            "parent_category": "Governance & Regulatory Compliance",
            "subcategory": "Approval & Affiliation Compliance",
            "canonical_concepts": ["regulatory.unapproved_course"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Different colleges in Bhopal and Lucknow.",
        "expected_evidence": ["Different institution IDs"],
        "counter_evidence_or_contradiction": "Identical statutory phrasing."
    },

    # -------------------------------------------------------------------------
    # Bucket 6: Action-History Corroboration (Related) - 3 pairs
    # -------------------------------------------------------------------------
    {
        "pair_id": "BENCH-27",
        "split": "held_out_test",
        "bucket": "action_history_corroborated",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-ACT-01A",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "General complaint regarding irregular institutional governance and staff dissatisfaction.",
            "received_date": "2026-08-01T10:00:00",
            "status": "Under Process",
            "last_action": "Investigation confirmed 4-month salary non-payment and salary arrears across electrical faculty",
        },
        "case_b": {
            "case_id": "RB-ACT-01B",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Official scrutiny of institution financial health following anonymous tip-off.",
            "received_date": "2026-08-20T14:00:00",
            "status": "Under Process",
            "last_action": "Joint scrutiny notice served: Audit team confirmed unpaid salary arrears and bank ledgers fraud in electrical division",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "ground_truth_label": "Related",
        "rationale": "Descriptions were vague, but official action reports both conclusively confirm identical salary arrears in the electrical division.",
        "expected_evidence": ["Action history corroboration", "Electrical faculty alignment", "Confirmed finding status"],
        "counter_evidence_or_contradiction": "Initial descriptions were broad/vague."
    },
    {
        "pair_id": "BENCH-28",
        "split": "dev_calibration",
        "bucket": "action_history_corroborated",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-ACT-02A",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "PGRC",
            "category": "Student Matter",
            "description": "Student petition alleging unfair treatment during exam registration.",
            "received_date": "2026-07-10T10:00:00",
            "status": "Under Process",
            "last_action": "Inquiry officer noted hall ticket withheld to enforce unauthorized development fee payment",
        },
        "case_b": {
            "case_id": "RB-ACT-02B",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "RB",
            "category": "Official Notice",
            "description": "Administrative notice on examination conduct compliance.",
            "received_date": "2026-07-22T12:00:00",
            "status": "Under Process",
            "last_action": "Seized cash receipts showing mandatory cash collections and capitation fees prior to admit card release",
        },
        "case_a_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges", "academic.exam_malpractice"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges", "academic.exam_malpractice"]
        },
        "ground_truth_label": "Related",
        "rationale": "Actions confirm hall tickets were held to extort unauthorized cash development fees.",
        "expected_evidence": ["Action findings converge on capitation fee and hall ticket withholding"],
        "counter_evidence_or_contradiction": "Categories were generic ('Student Matter' and 'Official Notice')."
    },
    {
        "pair_id": "BENCH-29",
        "split": "held_out_test",
        "bucket": "action_history_corroborated",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "AB-ACT-03A",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "Approval Bureau",
            "category": "Approval Compliance",
            "description": "Routine verification of mandatory annual faculty disclosure records.",
            "received_date": "2026-09-01T10:00:00",
            "status": "Under Process",
            "last_action": "Biometric inspection impounded absentee ghost faculty records for 8 professors",
        },
        "case_b": {
            "case_id": "RB-ACT-03B",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Regulatory follow-up on institutional compliance parameters.",
            "received_date": "2026-09-14T11:00:00",
            "status": "Under Process",
            "last_action": "Cross-verified impounded biometric records: Confirmed ghost professors and fake faculty certificates",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Recruitment & Qualifications",
            "canonical_concepts": ["faculty.ghost_faculty"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Recruitment & Qualifications",
            "canonical_concepts": ["faculty.ghost_faculty"]
        },
        "ground_truth_label": "Related",
        "rationale": "Both actions explicitly reference the same impounded biometric logs and ghost faculty.",
        "expected_evidence": ["Action remarks explicitly reference same impounded biometric records"],
        "counter_evidence_or_contradiction": "Descriptions were generic routine notices."
    },

    # -------------------------------------------------------------------------
    # Bucket 7: Contradictory Action Evidence (Not Related) - 3 pairs
    # -------------------------------------------------------------------------
    {
        "pair_id": "BENCH-30",
        "split": "held_out_test",
        "bucket": "action_history_contradictory",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-CONTRA-01A",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Faculty representation alleging salary arrears and unpaid remuneration.",
            "received_date": "2026-08-01T10:00:00",
            "status": "Under Process",
            "last_action": "Official inquiry established: Grievance exclusively pertains to Diploma Polytechnic wing faculty, fully distinct from Degree Engineering college",
        },
        "case_b": {
            "case_id": "RB-CONTRA-01B",
            "institution_id": "INST-DEL-01",
            "institution_name": "Apex Delhi Technical Institute",
            "bureau": "RB",
            "category": "Faculty Grievance",
            "description": "Degree engineering college faculty petition regarding 7th CPC scale implementation.",
            "received_date": "2026-08-15T14:00:00",
            "status": "Under Process",
            "last_action": "Verified: Pertains strictly to Autonomous Engineering College with separate budget and governing society",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Action records establish contradictory jurisdiction: One is Diploma wing with state board funding, other is Autonomous Engineering with separate trust.",
        "expected_evidence": ["Action notes explicitly contradict connection", "Different governing trusts confirmed"],
        "counter_evidence_or_contradiction": "Superficially identical salary arrears concept."
    },
    {
        "pair_id": "BENCH-31",
        "split": "dev_calibration",
        "bucket": "action_history_contradictory",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-CONTRA-02A",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "PGRC",
            "category": "Fee Irregularities",
            "description": "Student complaint alleging refusal of caution money refund.",
            "received_date": "2026-07-01T10:00:00",
            "status": "Disposed",
            "last_action": "Inquiry completed: Student had defaulted on hostel damages of Rs 15,000; deposit adjustment legally upheld and disposed",
        },
        "case_b": {
            "case_id": "RB-CONTRA-02B",
            "institution_id": "INST-MAH-02",
            "institution_name": "Sahyadri College of Engineering, Pune",
            "bureau": "RB",
            "category": "Fee Irregularities",
            "description": "Allegation of institutional policy denying fee refund upon AICTE national spot round migration.",
            "received_date": "2026-07-25T11:00:00",
            "status": "Under Process",
            "last_action": "Spot round migration policy under investigation",
        },
        "case_a_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Fee Refund Disputes",
            "canonical_concepts": ["fees.refund_dispute"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Fee Refund Disputes",
            "canonical_concepts": ["fees.refund_dispute"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Action findings in Case A established a legitimate personal hostel damage deduction, unconnected to the spot round institutional policy in Case B.",
        "expected_evidence": ["Action confirms personal damage deduction in Case A", "Case A is disposed"],
        "counter_evidence_or_contradiction": "Same category and concept (fee refund)."
    },
    {
        "pair_id": "BENCH-32",
        "split": "held_out_test",
        "bucket": "action_history_contradictory",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-CONTRA-03A",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "PGRC",
            "category": "Admission Malpractice",
            "description": "Student alleging irregular admission process.",
            "received_date": "2026-09-02T10:00:00",
            "status": "Disposed",
            "last_action": "Action report confirmed: Student candidate lacked minimum qualifying marks in JEE; admission denial was statutory and lawful",
        },
        "case_b": {
            "case_id": "AB-CONTRA-03B",
            "institution_id": "INST-UP-03",
            "institution_name": "Ganga Institute of Technology, Greater Noida",
            "bureau": "Approval Bureau",
            "category": "Admission Malpractice",
            "description": "Inquiry into unapproved intake and excess seats in computer science division.",
            "received_date": "2026-09-20T14:00:00",
            "status": "Under Process",
            "last_action": "Sanctioned intake audit ongoing",
        },
        "case_a_taxonomy": {
            "parent_category": "Admissions & Quota Compliance",
            "subcategory": "Eligibility & Document Fraud",
            "canonical_concepts": ["admissions.unapproved_intake"]
        },
        "case_b_taxonomy": {
            "parent_category": "Admissions & Quota Compliance",
            "subcategory": "Unapproved Intake Expansion",
            "canonical_concepts": ["admissions.unapproved_intake"]
        },
        "ground_truth_label": "Not Related",
        "rationale": "Case A was an ineligible applicant properly rejected; Case B is institutional excess intake. Action report explicitly disproves connection.",
        "expected_evidence": ["Action in Case A confirmed lawful student rejection", "Case A closed"],
        "counter_evidence_or_contradiction": "Same broad admission category."
    },

    # -------------------------------------------------------------------------
    # Bucket 8: Borderline / Ambiguous Review Required - 3 pairs
    # -------------------------------------------------------------------------
    {
        "pair_id": "BENCH-33",
        "split": "held_out_test",
        "bucket": "borderline_ambiguous",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-AMBIG-01A",
            "institution_id": "INST-BLR-04",
            "institution_name": "Silicon City Engineering Academy, Bengaluru",
            "bureau": "PGRC",
            "category": "Faculty Grievance",
            "description": "Faculty member alleging withholding of experience certificate and delayed clearance of final settlement dues.",
            "received_date": "2026-06-01T10:00:00",
            "status": "Under Process",
            "last_action": "Notice served to Management",
        },
        "case_b": {
            "case_id": "RB-AMBIG-01B",
            "institution_id": "INST-BLR-04",
            "institution_name": "Silicon City Engineering Academy, Bengaluru",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Anonymous allegation of faculty salary arrears in unnamed department.",
            "received_date": "2026-06-25T14:00:00",
            "status": "Pending",
            "last_action": "Preliminary notice drafted",
        },
        "case_a_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Service Conditions & Harassment",
            "canonical_concepts": ["faculty.certificate_retention", "faculty.salary_arrears"]
        },
        "case_b_taxonomy": {
            "parent_category": "Faculty & Employment",
            "subcategory": "Salary & Compensation",
            "canonical_concepts": ["faculty.salary_arrears"]
        },
        "ground_truth_label": "Further Review Required",
        "rationale": "Could be an isolated individual resignation dispute or part of the systemic salary arrears pattern in Case B. Facts are partial; requires human scrutiny.",
        "expected_evidence": ["Overlapping faculty domain", "Uncertain whether single officer dispute or systemic", "Pending review flags"],
        "counter_evidence_or_contradiction": "Case B has anonymous complainant and unnamed department."
    },
    {
        "pair_id": "BENCH-34",
        "split": "dev_calibration",
        "bucket": "borderline_ambiguous",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-AMBIG-02A",
            "institution_id": "INST-TN-05",
            "institution_name": "Chola Polytechnic College, Chennai",
            "bureau": "PGRC",
            "category": "Academic Administration",
            "description": "Students alleging examination fee collected without issuing computerized receipt.",
            "received_date": "2026-05-15T10:00:00",
            "status": "Pending",
            "last_action": "Explanation sought from Principal",
        },
        "case_b": {
            "case_id": "RB-AMBIG-02B",
            "institution_id": "INST-TN-05",
            "institution_name": "Chola Polytechnic College, Chennai",
            "bureau": "RB",
            "category": "Fee Irregularities",
            "description": "Allegation of unauthorized capitation fee collected from new first-year admissions.",
            "received_date": "2026-05-30T16:00:00",
            "status": "Under Process",
            "last_action": "Joint committee appointed",
        },
        "case_a_taxonomy": {
            "parent_category": "Academic & Student Affairs",
            "subcategory": "Examination & Evaluation Malpractice",
            "canonical_concepts": ["academic.exam_malpractice", "fees.capitation_charges"]
        },
        "case_b_taxonomy": {
            "parent_category": "Fees & Financial Compliance",
            "subcategory": "Capitation & Unauthorized Charges",
            "canonical_concepts": ["fees.capitation_charges"]
        },
        "ground_truth_label": "Further Review Required",
        "rationale": "Unclear whether exam fee receipt discrepancy is clerical incompetence or part of the unauthorized cash extortion scheme in Case B.",
        "expected_evidence": ["Shared cash/receipt theme", "Ambiguity on intent"],
        "counter_evidence_or_contradiction": "One is exam fee, other is first-year admission capitation."
    },
    {
        "pair_id": "BENCH-35",
        "split": "held_out_test",
        "bucket": "borderline_ambiguous",
        "institution_relationship": "same_institution",
        "case_a": {
            "case_id": "PGRC-AMBIG-03A",
            "institution_id": "INST-RJ-06",
            "institution_name": "Marwar Engineering College, Jaipur",
            "bureau": "PGRC",
            "category": "Infrastructure Deficiencies",
            "description": "Library reading room closed during examination week due to electrical renovation.",
            "received_date": "2026-09-01T10:00:00",
            "status": "Pending",
            "last_action": "Campus manager asked to expedite renovation",
        },
        "case_b": {
            "case_id": "RB-AMBIG-03B",
            "institution_id": "INST-RJ-06",
            "institution_name": "Marwar Engineering College, Jaipur",
            "bureau": "RB",
            "category": "Regulatory Audit",
            "description": "Surprise inspection noted non-operational computer lab and library deficiency due to disconnected power lines.",
            "received_date": "2026-09-18T14:00:00",
            "status": "Under Process",
            "last_action": "Inspection report pending review",
        },
        "case_a_taxonomy": {
            "parent_category": "Infrastructure & Facilities",
            "subcategory": "Library & IT Resources",
            "canonical_concepts": ["infrastructure.library_it"]
        },
        "case_b_taxonomy": {
            "parent_category": "Infrastructure & Facilities",
            "subcategory": "Library & IT Resources",
            "canonical_concepts": ["infrastructure.library_it"]
        },
        "ground_truth_label": "Further Review Required",
        "rationale": "Could be a temporary honest renovation or genuine structural neglect/failure to provide statutory library facilities. Human inspector must assess.",
        "expected_evidence": ["Common electrical/library theme", "Borderline between maintenance and statutory deficit"],
        "counter_evidence_or_contradiction": "Short time frame, factual cause unclear."
    }
]

def main():
    dest_path = Path("evaluation/ground_truth_benchmark.json")
    benchmark_payload = {
        "benchmark_version": "1.0.0",
        "description": "Curated, privacy-safe AICTE case-pair evaluation benchmark for hierarchical taxonomy and relationship detection.",
        "total_pairs": len(PAIRS),
        "split_summary": {
            "held_out_test": sum(1 for p in PAIRS if p["split"] == "held_out_test"),
            "dev_calibration": sum(1 for p in PAIRS if p["split"] == "dev_calibration"),
        },
        "label_distribution": {
            "Related": sum(1 for p in PAIRS if p["ground_truth_label"] == "Related"),
            "Not Related": sum(1 for p in PAIRS if p["ground_truth_label"] == "Not Related"),
            "Further Review Required": sum(1 for p in PAIRS if p["ground_truth_label"] == "Further Review Required"),
        },
        "pairs": PAIRS
    }
    with open(dest_path, "w", encoding="utf-8") as f:
        json.dump(benchmark_payload, f, indent=2)
    print(f"Generated {len(PAIRS)} benchmark pairs at {dest_path.resolve()}")
    print(f"Held-out test: {benchmark_payload['split_summary']['held_out_test']}, Dev calibration: {benchmark_payload['split_summary']['dev_calibration']}")

if __name__ == "__main__":
    main()
