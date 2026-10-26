from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from backend.database import Base


def utcnow() -> datetime:
    """Returns current UTC timestamp without timezone offset for database storage."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Institution(Base):
    """
    Institution Model
    Represents an AICTE-approved educational institution with a synthetic AICTE Permanent ID.
    """
    __tablename__ = "institutions"

    institution_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=False)
    region = Column(String(100), nullable=False, index=True)
    institution_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    complaints = relationship(
        "ComplaintCase",
        back_populates="institution",
        cascade="all, delete-orphan",
        order_by="desc(ComplaintCase.received_date)"
    )


class ComplaintCase(Base):
    """
    ComplaintCase Model
    Represents an official complaint registered against an institution across AICTE Bureaus/Cells.
    """
    __tablename__ = "complaint_cases"

    case_id = Column(String(64), primary_key=True, index=True)
    institution_id = Column(String(64), ForeignKey("institutions.institution_id", ondelete="CASCADE"), nullable=False, index=True)
    received_date = Column(DateTime, nullable=False, index=True)
    category = Column(String(120), nullable=False, index=True)
    description = Column(Text, nullable=False)
    bureau = Column(String(64), nullable=False, index=True)
    assigned_officer = Column(String(120), nullable=False)
    status = Column(String(32), nullable=False, index=True)  # Pending, Under Process, Disposed, Transferred, Escalated
    last_action = Column(String(255), nullable=True)
    next_action = Column(String(255), nullable=True)
    last_action_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    institution = relationship("Institution", back_populates="complaints")
    action_history = relationship(
        "CaseAction",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="desc(CaseAction.action_date)"
    )


class CaseAction(Base):
    """
    CaseAction Model (Collaboration with Backend Developer 2)
    Maintains an audit trail of actions taken, status changes, and officer remarks for each case.
    """
    __tablename__ = "case_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(64), ForeignKey("complaint_cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    action_taken = Column(String(255), nullable=False)
    action_by = Column(String(120), nullable=False)
    action_date = Column(DateTime, default=utcnow, nullable=False, index=True)
    remarks = Column(Text, nullable=True)
    next_action = Column(String(255), nullable=True)
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=True)

    # Relationship
    case = relationship("ComplaintCase", back_populates="action_history")


class CoordinationReview(Base):
    """
    CoordinationReview Model (Collaboration with Backend Developer 2 and Person 5)
    Represents potential cross-bureau overlap detections and joint coordination reviews.
    """
    __tablename__ = "coordination_reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    primary_case_id = Column(String(64), ForeignKey("complaint_cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    secondary_case_id = Column(String(64), ForeignKey("complaint_cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=True)
    overlap_reason = Column(Text, nullable=True)
    status = Column(String(64), default="Pending Review", nullable=False, index=True)
    reviewer_decision = Column(String(120), nullable=True)
    reviewer_remarks = Column(Text, nullable=True)
    reviewed_by = Column(String(120), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
