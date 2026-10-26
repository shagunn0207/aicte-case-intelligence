/**
 * SYNTHETIC DEMO DATA — NOT OFFICIAL AICTE RECORDS
 *
 * This file contains fictional case records, institutions, and algorithmic overlap
 * signals created exclusively for demonstration and development purposes for SIH 2026.
 * None of the names, institution IDs, or grievance texts represent real persons or entities.
 */

export const DEMO_DISCLAIMER_LABEL = "SYNTHETIC DEMO DATA — NOT OFFICIAL AICTE RECORDS";

export const INITIAL_INSTITUTIONS = [
  {
    id: "AICTE-PID-100245",
    name: "Example Institute of Technology",
    region: "Northern Region (NWRO)",
    state: "Uttar Pradesh",
    city: "Noida",
    address: "Plot 14-B, Knowledge Park III, Sector 62, Institutional Area, Noida 201309",
    establishedYear: 2004,
    institutionType: "Private Unaided Engineering Institution",
    approvedIntake: 720,
    activePrograms: ["B.Tech Computer Science", "B.Tech Mechanical Engg", "B.Tech Electronics", "MBA"],
    status: "Affiliated / Approved with Deficiencies",
    isMock: true
  },
  {
    id: "AICTE-PID-100892",
    name: "Saraswati College of Engineering & Research",
    region: "Western Region (WRO)",
    state: "Maharashtra",
    city: "Pune",
    address: "Survey No. 44/2, Hinjewadi Phase 1, Pune 411057",
    establishedYear: 2008,
    institutionType: "Trust Managed Technical Institution",
    approvedIntake: 600,
    activePrograms: ["B.Tech Civil", "B.Tech AI & Data Science", "B.Tech IT", "M.Tech"],
    status: "Approved",
    isMock: true
  },
  {
    id: "AICTE-PID-100611",
    name: "Himalayan Institute of Technology & Management",
    region: "Northern Region (NWRO)",
    state: "Uttarakhand",
    city: "Dehradun",
    address: "Chakrata Road, Selaqui Industrial Area, Dehradun 248197",
    establishedYear: 2011,
    institutionType: "Private Technical Institute",
    approvedIntake: 480,
    activePrograms: ["B.Tech CSE", "B.Tech Electrical", "Diploma Engg"],
    status: "Approved",
    isMock: true
  },
  {
    id: "AICTE-PID-100430",
    name: "Kaveri Technical University Campus",
    region: "South Western Region (SWRO)",
    state: "Karnataka",
    city: "Mysuru",
    address: "Bannur Road, Alanahalli, Mysuru 570028",
    establishedYear: 1999,
    institutionType: "Constituent College",
    approvedIntake: 960,
    activePrograms: ["B.Tech CSE", "B.Tech Mechanical", "B.Tech Biotech", "M.Tech"],
    status: "Approved",
    isMock: true
  }
];

export const INITIAL_CASES = {
  "PGRC-2026-1042": {
    caseId: "PGRC-2026-1042",
    bureauCode: "PGRC",
    bureauName: "Public Grievance Redressal Cell",
    institutionId: "AICTE-PID-100245",
    institutionName: "Example Institute of Technology",
    status: "Under Review",
    priority: "High",
    filingDate: "2026-01-12",
    lastUpdated: "2026-02-04",
    deskOfficer: "Dr. Ananya Roy (Assistant Director, Grievance Cell)",
    sourceType: "Faculty Forum Petition (CPGRAMS Ref: AICTE/2026/G/00918)",
    complainantGroup: "Ad-hoc Faculty Welfare Association (rep. by Dr. S. K. Verma)",
    title: "Irregular Faculty Appointments and Withholding of 7th CPC Scales in Mechanical & CSE",
    summary: "Formal complaint lodged by 18 ad-hoc and assistant professors alleging that the institution artificially inflates faculty rosters submitted to AICTE while paying below-norm stipends and retaining mandatory original certificates.",
    detailedAllegations: [
      "Eighteen ad-hoc faculty members are coerced to sign dual voucher registers: one submitted during AICTE inspections indicating full 7th CPC basic pay, and a secret register with ~40% deductions.",
      "The Mechanical Engineering department lists 4 full professors on the AICTE portal who have never taken a single class or received EPF contributions from the trust account.",
      "Original postgraduate and doctoral degree certificates of 7 assistant professors are held in trust custody to prevent resignations before the upcoming AICTE approval cycle.",
      "Actual student-to-faculty ratio in core B.Tech Mechanical courses is approximately 1:29, compared to the required 1:15 norm certified in the mandatory disclosure."
    ],
    overlappingKeywords: [
      "Mechanical Engineering Cadre Deficit",
      "Ghost Faculty Roster",
      "7th CPC Pay Slip Discrepancy",
      "Academic Year 2025-2026",
      "Knowledge Park III Campus",
      "Faculty Headcount"
    ],
    documents: [
      { name: "PGRC-Grievance-Petition.pdf", type: "Formal Petition", size: "1.4 MB", uploadDate: "2026-01-12" },
      { name: "Bank-Salary-Credit-Extracts-AnnexureB.xlsx", type: "Financial Evidence", size: "480 KB", uploadDate: "2026-01-12" },
      { name: "Affidavits-12-Faculty-Signed.pdf", type: "Legal Sworn Statement", size: "3.2 MB", uploadDate: "2026-01-14" },
      { name: "Institution-Interim-Denial-Letter.pdf", type: "Institution Rejoinder", size: "820 KB", uploadDate: "2026-02-04" }
    ],
    timeline: [
      { id: "act-101", date: "2026-01-12", bureau: "PGRC", actor: "Grievance Portal", type: "Case Registered", description: "Formal grievance received via Centralized Public Grievance Redress and Monitoring System (CPGRAMS)." },
      { id: "act-102", date: "2026-01-16", bureau: "PGRC", actor: "Desk Officer", type: "Preliminary Scrutiny", description: "Scrutiny completed by Assistant Director. Prima facie case of regulatory wage violation established." },
      { id: "act-103", date: "2026-01-22", bureau: "PGRC", actor: "AICTE HQ", type: "Notice Issued", description: "Formal notice issued to Principal and Chairman seeking sworn reply within 14 working days." },
      { id: "act-104", date: "2026-02-04", bureau: "PGRC", actor: "Institution", type: "Rejoinder Received", description: "Management submitted reply claiming allegations are motivated by disaffected temporary staff." }
    ],
    isMock: true
  },

  "RB-2026-0281": {
    caseId: "RB-2026-0281",
    bureauCode: "RB",
    bureauName: "Regulation Bureau",
    institutionId: "AICTE-PID-100245",
    institutionName: "Example Institute of Technology",
    status: "In Progress",
    priority: "High",
    filingDate: "2026-01-28",
    lastUpdated: "2026-02-06",
    deskOfficer: "Shri Rajeshwar Meena (Director, Regulation Bureau)",
    sourceType: "Surprise Vigilance & Regulation Inspection Panel (Panel NWRO-3)",
    complainantGroup: "AICTE Standing Hearing Committee Inspection Report",
    title: "Deficit in Qualified Faculty Cadre & Unapproved Evening Shift in Mechanical Engineering",
    summary: "Expert Committee surprise inspection found severe cadre ratio imbalances, non-presence of doctoral professors during physical audit, and unauthorized dual-utilization of certified CAD laboratories.",
    detailedAllegations: [
      "Physical headcount conducted on 28 January 2026 revealed that out of 24 declared faculty in Mechanical Engg, only 11 were present; no biometric logs or leave applications existed for the 13 absentees.",
      "Inspection panel verified that 3 senior professors registered under AICTE portal profiles are concurrent full-time appointees in another private technical university in Gurugram.",
      "CAD/CAM computing labs declared exclusively for AICTE B.Tech courses were observed conducting evening vocational batches without prior Approval Bureau sanction.",
      "Library physical holdings of standard reference titles for Mechanical CAD & Thermal Engineering fall short by 64% against the Approval Process Handbook norms."
    ],
    overlappingKeywords: [
      "Mechanical Engineering Cadre Deficit",
      "Absentee Faculty Names",
      "Surprise Inspection Jan 2026",
      "Academic Year 2025-2026",
      "Dual Employment / Ghost Roster",
      "CAD Lab Inspection"
    ],
    documents: [
      { name: "Surprise-Inspection-Report-SIR-281.pdf", type: "Inspection Dossier", size: "4.8 MB", uploadDate: "2026-02-03" },
      { name: "Physical-Headcount-Roster-Sheet.pdf", type: "Verification Sheet", size: "1.1 MB", uploadDate: "2026-02-03" },
      { name: "Biometric-Comparison-Report.xlsx", type: "Audit Data", size: "620 KB", uploadDate: "2026-02-05" },
      { name: "Show-Cause-Notice-APH-Reg14.pdf", type: "Regulatory Notice", size: "950 KB", uploadDate: "2026-02-06" }
    ],
    timeline: [
      { id: "act-201", date: "2026-01-28", bureau: "RB", actor: "Expert Panel NWRO-3", type: "Physical Inspection", description: "Surprise on-site inspection conducted at Plot 14-B Knowledge Park III campus by 3-member expert committee." },
      { id: "act-202", date: "2026-02-03", bureau: "RB", actor: "Panel Chairman", type: "Inspection Report Filed", description: "Formal report submitted to Regulation Bureau citing critical faculty cadre and infrastructure lapses." },
      { id: "act-203", date: "2026-02-06", bureau: "RB", actor: "Regulation Bureau", type: "Show Cause Issued", description: "Statutory show-cause notice issued under Regulation 14 of Approval Process Handbook 2025-26." },
      { id: "act-204", date: "2026-02-10", bureau: "SYSTEM", actor: "Matching Engine", type: "Overlap Flagged", description: "AICTE Case Intelligence Engine detected 91% multi-bureau overlap with grievance case PGRC-2026-1042." }
    ],
    isMock: true
  },

  "AB-2026-0155": {
    caseId: "AB-2026-0155",
    bureauCode: "AB",
    bureauName: "Approval Bureau",
    institutionId: "AICTE-PID-100892",
    institutionName: "Saraswati College of Engineering & Research",
    status: "Under Review",
    priority: "Medium",
    filingDate: "2026-01-08",
    lastUpdated: "2026-01-30",
    deskOfficer: "Smt. Suniti Deshmukh (Deputy Director, Approval Bureau)",
    sourceType: "Extension of Approval (EoA) 2026-27 Application",
    complainantGroup: "Institutional Portal Application",
    title: "Application for Extension of Approval and Additional 60-Seat Intake in AI & Data Science",
    summary: "Annual portal submission for Extension of Approval (EoA) and introduction of new specialization with proposed expansion into newly acquired wing.",
    detailedAllegations: [
      "Institution declared additional built-up area of 4,200 sq.m on Survey No. 44/2.",
      "Structural stability certificate submitted from an unverified municipal engineer.",
      "Sanctioned faculty recruitment commitments submitted on self-certification."
    ],
    overlappingKeywords: ["Survey No. 44/2", "Building Completion Certificate", "Pune Hinjewadi Campus", "Trust Land Title"],
    documents: [
      { name: "EoA-Application-2026.pdf", type: "Portal Submission", size: "3.5 MB", uploadDate: "2026-01-08" },
      { name: "Land-Title-Deed-Survey44.pdf", type: "Legal Document", size: "2.1 MB", uploadDate: "2026-01-08" }
    ],
    timeline: [
      { id: "act-301", date: "2026-01-08", bureau: "AB", actor: "Portal", type: "Application Submitted", description: "Institution submitted online EoA 2026-27 application." }
    ],
    isMock: true
  },

  "VIG-2026-0043": {
    caseId: "VIG-2026-0043",
    bureauCode: "VIG",
    bureauName: "Vigilance Cell",
    institutionId: "AICTE-PID-100892",
    institutionName: "Saraswati College of Engineering & Research",
    status: "In Progress",
    priority: "Critical",
    filingDate: "2026-01-20",
    lastUpdated: "2026-02-08",
    deskOfficer: "Col. V. P. Sharma (Chief Vigilance Officer, AICTE)",
    sourceType: "Confidential Whistleblower Complaint",
    complainantGroup: "Whistleblower / Local Revenue Authority Query",
    title: "Investigation into Forged Municipal Occupancy and Disputed Title Deed on Survey 44/2",
    summary: "Vigilance Cell initiated inquiry following alert from State Town Planning Department regarding counterfeit occupancy certificate used in previous AICTE approvals.",
    detailedAllegations: [
      "Occupancy certificate No. PCMC/TP/2023/889 submitted in portal does not exist in civic archives.",
      "Portion of Survey 44/2 is sub-judice under Pune District Civil Court title injunction.",
      "Mortgage encumbrance was not disclosed in the mandatory disclosure submitted to Approval Bureau."
    ],
    overlappingKeywords: ["Survey No. 44/2", "Building Completion Certificate", "Pune Hinjewadi Campus", "Trust Land Title"],
    documents: [
      { name: "Town-Planning-Verification-Denial.pdf", type: "Official Letter", size: "900 KB", uploadDate: "2026-01-20" }
    ],
    timeline: [
      { id: "act-401", date: "2026-01-20", bureau: "VIG", actor: "CVO Office", type: "Vigilance File Opened", description: "Inquiry initiated on municipal certificate genuineness." }
    ],
    isMock: true
  },

  "PGRC-2026-0988": {
    caseId: "PGRC-2026-0988",
    bureauCode: "PGRC",
    bureauName: "Public Grievance Redressal Cell",
    institutionId: "AICTE-PID-100611",
    institutionName: "Himalayan Institute of Technology & Management",
    status: "Under Review",
    priority: "Medium",
    filingDate: "2025-12-15",
    lastUpdated: "2026-01-18",
    deskOfficer: "Dr. K. L. Negi",
    sourceType: "Student Welfare Representation",
    complainantGroup: "Hostel Students Action Committee",
    title: "Allegation of Arbitrary Hostel Maintenance Fees and Unsanctioned Penalties",
    summary: "Grievance alleging charging of supplemental development fees beyond state fee fixation committee limits for campus boarding.",
    detailedAllegations: ["Mandatory hostel fee hiked by 35% without state fee regulator approval."],
    overlappingKeywords: ["Hostel Amenities", "Fee Structure", "Dehradun Campus"],
    documents: [],
    timeline: [
      { id: "act-501", date: "2025-12-15", bureau: "PGRC", actor: "Portal", type: "Complaint Registered", description: "Received via CPGRAMS." }
    ],
    isMock: true
  },

  "RB-2026-0199": {
    caseId: "RB-2026-0199",
    bureauCode: "RB",
    bureauName: "Regulation Bureau",
    institutionId: "AICTE-PID-100611",
    institutionName: "Himalayan Institute of Technology & Management",
    status: "In Progress",
    priority: "Low",
    filingDate: "2026-01-10",
    lastUpdated: "2026-01-24",
    deskOfficer: "Shri M. Rawat",
    sourceType: "Routine Statutory Audit",
    complainantGroup: "Anti-Ragging Compliance Cell",
    title: "Audit of Campus Anti-Ragging Measures and Resident Warden Qualifications",
    summary: "Compliance audit regarding implementation of AICTE Regulations on Curbing the Menace of Ragging in Higher Educational Institutions.",
    detailedAllegations: ["CCTV coverage missing in hostel dining hall; warden logbooks incomplete."],
    overlappingKeywords: ["Hostel Amenities", "Anti-Ragging", "Dehradun Campus"],
    documents: [],
    timeline: [
      { id: "act-601", date: "2026-01-10", bureau: "RB", actor: "Field Inspector", type: "Audit Conducted", description: "Routine compliance checklist completed." }
    ],
    isMock: true
  },

  "SDC-2026-0112": {
    caseId: "SDC-2026-0112",
    bureauCode: "SDC",
    bureauName: "Skill Development Cell",
    institutionId: "AICTE-PID-100430",
    institutionName: "Kaveri Technical University Campus",
    status: "Under Review",
    priority: "Medium",
    filingDate: "2025-11-20",
    lastUpdated: "2026-01-05",
    deskOfficer: "Dr. P. Venkatesh",
    sourceType: "Scheme Fund Audit",
    complainantGroup: "PMKVY National Portal Audit",
    title: "Discrepancy in PMKVY 4.0 Trainee Certification Roster and Assessment Records",
    summary: "Audit flagged mismatch between candidates registered for AICTE-sponsored skill training and attendance biometric punches.",
    detailedAllegations: ["38 certified trainees have no matching biometric attendance logs in server."],
    overlappingKeywords: ["Skill Training Biometrics", "PMKVY Grant", "Mysuru Campus"],
    documents: [],
    timeline: [
      { id: "act-701", date: "2025-11-20", bureau: "SDC", actor: "Audit System", type: "Audit Discrepancy", description: "Discrepancy flagged during fund release reconciliation." }
    ],
    isMock: true
  },

  "PGRC-2026-0870": {
    caseId: "PGRC-2026-0870",
    bureauCode: "PGRC",
    bureauName: "Public Grievance Redressal Cell",
    institutionId: "AICTE-PID-100430",
    institutionName: "Kaveri Technical University Campus",
    status: "Under Review",
    priority: "Medium",
    filingDate: "2025-12-02",
    lastUpdated: "2026-01-15",
    deskOfficer: "Dr. Ananya Roy",
    sourceType: "Student Representation",
    complainantGroup: "Trainee Representatives",
    title: "Non-disbursement of PMKVY Direct Benefit Transfer Stipends",
    summary: "Grievance submitted by 22 enrolled trainees alleging college administration withheld course completion certificates and stipend passes.",
    detailedAllegations: ["Trainees completed 400 hrs training but received no DBT allowance."],
    overlappingKeywords: ["Skill Training Biometrics", "PMKVY Grant", "Mysuru Campus"],
    documents: [],
    timeline: [
      { id: "act-801", date: "2025-12-02", bureau: "PGRC", actor: "Portal", type: "Grievance Filed", description: "Lodged via Student Redressal portal." }
    ],
    isMock: true
  }
};

export const INITIAL_OVERLAPS = [
  {
    id: "OVL-2026-0814",
    institutionId: "AICTE-PID-100245",
    institutionName: "Example Institute of Technology",
    institutionRegion: "Northern Region (NWRO)",
    institutionCity: "Noida, UP",
    caseAId: "PGRC-2026-1042",
    caseBId: "RB-2026-0281",
    caseABureau: "PGRC",
    caseBBureau: "RB",
    caseAStatus: "Under Review",
    caseBStatus: "In Progress",
    matchScore: 91,
    detectedDate: "2026-02-10",
    lastUpdated: "2026-02-10",
    status: "Pending Review",
    summary: "High algorithmic convergence detected between faculty grievance petition (PGRC) and surprise regulatory inspection findings (RB) regarding fictitious faculty rosters and non-compliance with cadre norms in Mechanical and CSE departments.",
    keySignals: [
      "Identical Institution Permanent ID (PID: 100245)",
      "9 Overlapping Faculty Names in Salary Petition vs Inspection Absentees",
      "Mechanical Engg Cadre Ratio Deficit in AY 2025-26",
      "Shared Campus Location at Plot 14-B Knowledge Park III"
    ],
    matchReasons: [
      {
        id: "sig-1",
        signalName: "Permanent Institution ID Match",
        category: "Entity Identity",
        score: 100,
        weight: "Primary Identifier",
        description: "Both proceedings are indexed under AICTE Permanent Institute ID AICTE-PID-100245 with identical legal trust credentials.",
        evidenceExtract: "PID: AICTE-PID-100245 | Trust: Example Educational & Charitable Society (Reg. 884/2001)",
        verificationAction: "Confirmed exact match across AICTE Approval Master DB."
      },
      {
        id: "sig-2",
        signalName: "Faculty Roster & Named Person Entity Overlap",
        category: "Named Entities",
        score: 94,
        weight: "High Confidence",
        description: "9 faculty members named in the Grievance Affidavit (PGRC Annexure B) correspond exactly with the 13 faculty members recorded as absent during the Regulation Bureau surprise inspection.",
        evidenceExtract: "Matched records: Dr. S. K. Verma, Prof. M. K. Gupta, Asst. Prof. Ritu Sharma, Asst. Prof. Amit Saxena (+5 others). Both cases cite non-payment of EPF and absence of teaching logs.",
        verificationAction: "Verify PAN and Aadhaar seeds against AICTE Faculty Portal database."
      },
      {
        id: "sig-3",
        signalName: "Allegation & Regulatory Breach Topic Convergence",
        category: "Semantic Analysis",
        score: 89,
        weight: "Moderate-High",
        description: "High vector similarity across substantive grievance claims and inspection defect findings concerning Cadre Norms (1:15 ratio violation, zero Professors in Mechanical Dept).",
        evidenceExtract: "PGRC petition asserts: 'Management reported 1:15 ratio fraudulently'; RB Inspection Report states: 'Physical ratio verified at 1:28; 0 Professors in position vs 4 required'.",
        verificationAction: "Cross-examine Principal's explanation submitted to PGRC against RB inspection log."
      },
      {
        id: "sig-4",
        signalName: "Temporal & Inspection Cycle Coincidence",
        category: "Temporal Alignment",
        score: 100,
        weight: "High Context",
        description: "Grievance lodged on 12 Jan 2026 precedes Regulation surprise inspection by only 16 days (28 Jan 2026). Both pertain to ongoing Academic Year 2025-26 approval validity.",
        evidenceExtract: "PGRC Filing: 2026-01-12 | RB Inspection: 2026-01-28 | Both matters active and unresolved.",
        verificationAction: "Align hearing schedule so Standing Hearing Committee (SHC) reviews both dossiers jointly."
      }
    ],
    reviewHistory: [
      {
        id: "rev-001",
        timestamp: "2026-02-10T11:30:00Z",
        reviewerName: "AICTE Intelligence Engine (Automated)",
        reviewerDesignation: "Multi-Bureau Match Service v2.4",
        reviewerEmail: "system.intelligence@aicte-india.org",
        decision: "Pending Review",
        remarks: "Automated alert: High overlap confidence (91%) calculated based on entity PID, named faculty token collision, and shared subject matter. Routed to Central Grievance & Regulation Desk for human review.",
        isSystem: true
      }
    ],
    isMock: true
  },
  {
    id: "OVL-2026-0822",
    institutionId: "AICTE-PID-100892",
    institutionName: "Saraswati College of Engineering & Research",
    institutionRegion: "Western Region (WRO)",
    institutionCity: "Pune, MH",
    caseAId: "AB-2026-0155",
    caseBId: "VIG-2026-0043",
    caseABureau: "AB",
    caseBBureau: "VIG",
    caseAStatus: "Under Review",
    caseBStatus: "In Progress",
    matchScore: 87,
    detectedDate: "2026-02-08",
    lastUpdated: "2026-02-08",
    status: "Coordination Required",
    summary: "Critical conflict detected: Approval Bureau is reviewing an application for 60-seat expansion on Survey 44/2 while Vigilance Cell has an active probe into counterfeit municipal occupancy certificates on that exact land parcel.",
    keySignals: [
      "Identical Land Survey No. 44/2 (Hinjewadi, Pune)",
      "Conflicting Approval vs Vigilance Inquiries",
      "Forged Municipal Occupancy Certificate Alert",
      "Risk of Approving Expansion on Sub-Judice Land"
    ],
    matchReasons: [
      {
        id: "sig-21",
        signalName: "Land Parcel & Survey Number Overlap",
        category: "Asset & Location",
        score: 100,
        weight: "Primary Identifier",
        description: "Exact match on cadastral land plot Survey No. 44/2.",
        evidenceExtract: "AB portal application uses Survey 44/2 for M.Tech expansion; Vigilance file notes Pune Municipal denial of completion certificate for Survey 44/2.",
        verificationAction: "Approval Bureau must withhold EoA processing pending Vigilance Cell clearance."
      },
      {
        id: "sig-22",
        signalName: "Procedural Collision Alert",
        category: "Procedural",
        score: 87,
        weight: "High Impact",
        description: "Risk of granting additional intake while title fraud investigation is underway.",
        evidenceExtract: "AB case status: Under Review | VIG case status: Critical Investigation.",
        verificationAction: "Immediate inter-bureau hold flag requested."
      }
    ],
    reviewHistory: [
      {
        id: "rev-002",
        timestamp: "2026-02-08T14:15:00Z",
        reviewerName: "Shri S. K. Narayanan",
        reviewerDesignation: "Senior Legal Advisor, AICTE HQ",
        reviewerEmail: "legal.advisor@aicte-india.org",
        decision: "Coordination Required",
        remarks: "Joint coordination ordered. Approval Bureau instructed to place EoA portal application under 'Administrative Withholding' until Chief Vigilance Officer submits final status report.",
        isSystem: false
      }
    ],
    isMock: true
  },
  {
    id: "OVL-2026-0791",
    institutionId: "AICTE-PID-100611",
    institutionName: "Himalayan Institute of Technology & Management",
    institutionRegion: "Northern Region (NWRO)",
    institutionCity: "Dehradun, UK",
    caseAId: "PGRC-2026-0988",
    caseBId: "RB-2026-0199",
    caseABureau: "PGRC",
    caseBBureau: "RB",
    caseAStatus: "Under Review",
    caseBStatus: "In Progress",
    matchScore: 73,
    detectedDate: "2026-01-26",
    lastUpdated: "2026-01-29",
    status: "Continue Independently",
    summary: "Overlap detected on campus hostel facilities. However, PGRC case relates to fee regulation while RB audit relates to anti-ragging security provisions; no procedural conflict identified.",
    keySignals: [
      "Shared Campus Hostel Amenities",
      "Independent Statutory Tracks (Fee Regulation vs Anti-Ragging)",
      "Different Competent Authorities"
    ],
    matchReasons: [
      {
        id: "sig-31",
        signalName: "Facility Keyword Convergence",
        category: "Keyword Analysis",
        score: 73,
        weight: "Contextual",
        description: "Both files reference Student Hostel Block A and Residential Warden.",
        evidenceExtract: "PGRC references hostel maintenance fees; RB references hostel anti-ragging CCTV coverage.",
        verificationAction: "Reviewed by Regional Desk Officer: scopes are separate and non-interfering."
      }
    ],
    reviewHistory: [
      {
        id: "rev-003",
        timestamp: "2026-01-29T10:00:00Z",
        reviewerName: "Dr. K. L. Negi",
        reviewerDesignation: "Regional Officer, NWRO Chandigarh",
        reviewerEmail: "ro.nwro@aicte-india.org",
        decision: "Continue Independently",
        remarks: "Evaluated both files. No conflict of interest. Fee matter will be adjudicated by State Fee Committee; anti-ragging compliance is routine statutory monitoring. Continue on separate tracks.",
        isSystem: false
      }
    ],
    isMock: true
  },
  {
    id: "OVL-2026-0640",
    institutionId: "AICTE-PID-100430",
    institutionName: "Kaveri Technical University Campus",
    institutionRegion: "South Western Region (SWRO)",
    institutionCity: "Mysuru, KA",
    caseAId: "SDC-2026-0112",
    caseBId: "PGRC-2026-0870",
    caseABureau: "SDC",
    caseBBureau: "PGRC",
    caseAStatus: "Under Review",
    caseBStatus: "Under Review",
    matchScore: 68,
    detectedDate: "2026-01-18",
    lastUpdated: "2026-01-20",
    status: "Further Review Required",
    summary: "Skill Development Cell grant reconciliation discrepancy corresponds to student grievance regarding withheld PMKVY stipends. Missing biometric records require regional office field verification.",
    keySignals: [
      "PMKVY Scheme Grant No. 2024/SDC/4102",
      "Stipend Passbook Discrepancy",
      "Biometric Attendance Mismatch"
    ],
    matchReasons: [
      {
        id: "sig-41",
        signalName: "Scheme Reference Match",
        category: "Grant & Scheme ID",
        score: 85,
        weight: "High Weight",
        description: "Both files cite the same PMKVY training batch identifier.",
        evidenceExtract: "Batch ID: KA-MYS-PMKVY-2025-04 | 38 trainees registered.",
        verificationAction: "Depute an inspection officer from SWRO Bangalore to verify physical attendance registers."
      }
    ],
    reviewHistory: [
      {
        id: "rev-004",
        timestamp: "2026-01-20T16:45:00Z",
        reviewerName: "Dr. P. Venkatesh",
        reviewerDesignation: "Director, Skill Development Cell",
        reviewerEmail: "dir.sdc@aicte-india.org",
        decision: "Further Review Required",
        remarks: "Need bank transfer ledger from college trust before confirming whether funds were held back by institution or delayed at PFMS level. Escalate to Regional Director SWRO.",
        isSystem: false
      }
    ],
    isMock: true
  }
];

const STORAGE_KEY = 'aicte_case_intel_demo_store_v1';

/**
 * Loads mock store from SessionStorage/LocalStorage or returns initial fixture data
 */
export function getMockStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.overlaps && parsed.cases) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read from localStorage, using in-memory mock fixtures", e);
  }

  const initialStore = {
    overlaps: INITIAL_OVERLAPS,
    cases: INITIAL_CASES,
    institutions: INITIAL_INSTITUTIONS
  };
  saveMockStore(initialStore);
  return initialStore;
}

/**
 * Persists mock store to LocalStorage
 */
export function saveMockStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("Could not persist mock store to localStorage", e);
  }
}

/**
 * Resets the demo store to its initial pristine fixtures
 */
export function resetMockStore() {
  const initialStore = {
    overlaps: INITIAL_OVERLAPS,
    cases: INITIAL_CASES,
    institutions: INITIAL_INSTITUTIONS
  };
  saveMockStore(initialStore);
  return initialStore;
}
