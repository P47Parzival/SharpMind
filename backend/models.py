from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String, default="Explorer")
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    total_points = Column(Integer, default=0)
    streak_count = Column(Integer, default=0)
    last_active = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    detected_objects = relationship("DetectedObject", back_populates="user")
    finder_challenges = relationship("FinderChallenge", back_populates="user")


class DetectedObject(Base):
    __tablename__ = "detected_objects"

    id = Column(Integer, primary_key=True, index=True)
    object_name = Column(String, index=True)
    description = Column(String)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="detected_objects")


class FinderChallenge(Base):
    __tablename__ = "finder_challenges"

    id = Column(Integer, primary_key=True, index=True)
    target_object = Column(String)
    is_completed = Column(Boolean, default=False)
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="finder_challenges")
