from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from schemas.detection import UserCreate, UserResponse, UserStatsResponse
from database import SessionLocal
import models

router = APIRouter(prefix="/users", tags=["Users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    db_user = models.User(
        display_name=user.display_name,
        email=user.email,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user stats including objects detected and challenges completed."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    objects_detected = (
        db.query(models.DetectedObject)
        .filter(models.DetectedObject.user_id == user_id)
        .count()
    )
    challenges_completed = (
        db.query(models.FinderChallenge)
        .filter(
            models.FinderChallenge.user_id == user_id,
            models.FinderChallenge.is_completed == True,
        )
        .count()
    )

    return UserStatsResponse(
        id=user.id,
        display_name=user.display_name,
        total_points=user.total_points,
        streak_count=user.streak_count,
        objects_detected=objects_detected,
        challenges_completed=challenges_completed,
    )

from pydantic import BaseModel

class DeductPointsRequest(BaseModel):
    amount: int

@router.post("/{user_id}/deduct")
async def deduct_points(user_id: int, req: DeductPointsRequest, db: Session = Depends(get_db)):
    """Deduct points from user for redemption."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.total_points < req.amount:
        raise HTTPException(status_code=400, detail="Not enough points")
        
    user.total_points -= req.amount
    db.commit()
    db.refresh(user)
    return {"status": "success", "new_total": user.total_points}
