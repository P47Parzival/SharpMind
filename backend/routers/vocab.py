from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schemas.detection import PronunciationRequest, PronunciationResponse
from services.groq_voice import evaluate_pronunciation
from database import SessionLocal
import models
from services.user_service import award_points_and_update_streak

router = APIRouter(prefix="/vocab", tags=["Improve Vocab"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/pronounce", response_model=PronunciationResponse)
async def check_pronunciation(
    request: PronunciationRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluate pronunciation for the target word based on audio base64 payload.
    If correct, awards 5 points.
    """
    result = await evaluate_pronunciation(request.target_word, request.audio_base64)
    
    is_correct = result.get("is_correct", False)
    feedback = result.get("feedback", "Let's try again!")
    
    points_earned = 0
    if is_correct:
        points_earned = 5
        award_points_and_update_streak(db, user_id=1, points=points_earned)
        
    return PronunciationResponse(
        is_correct=is_correct,
        feedback=feedback,
        points_earned=points_earned,
    )
