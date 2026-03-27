import random
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from schemas.detection import (
    FinderChallengeResponse,
    FinderVerifyRequest,
    FinderVerifyResponse,
)
from services.groq_vision import verify_object
from database import SessionLocal
import models

router = APIRouter(prefix="/finder", tags=["Object Finder Game"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Common objects that kids can easily find around them
FINDER_OBJECTS = [
    {"name": "Cup", "hint": "You drink water from it", "emoji": "🥤"},
    {"name": "Book", "hint": "You read stories from it", "emoji": "📖"},
    {"name": "Shoe", "hint": "You wear it on your feet", "emoji": "👟"},
    {"name": "Chair", "hint": "You sit on it", "emoji": "🪑"},
    {"name": "Pen", "hint": "You write with it", "emoji": "🖊️"},
    {"name": "Phone", "hint": "You can call someone with it", "emoji": "📱"},
    {"name": "Bag", "hint": "You carry your things in it", "emoji": "🎒"},
    {"name": "Bottle", "hint": "You keep water in it", "emoji": "🧴"},
    {"name": "Clock", "hint": "It tells you the time", "emoji": "🕐"},
    {"name": "Lamp", "hint": "It gives you light", "emoji": "💡"},
    {"name": "Spoon", "hint": "You eat food with it", "emoji": "🥄"},
    {"name": "Plate", "hint": "You put food on it", "emoji": "🍽️"},
    {"name": "Key", "hint": "You use it to open a lock", "emoji": "🔑"},
    {"name": "Ball", "hint": "You can throw and catch it", "emoji": "⚽"},
    {"name": "Pencil", "hint": "You draw pictures with it", "emoji": "✏️"},
    {"name": "Toy", "hint": "You play with it", "emoji": "🧸"},
    {"name": "Pillow", "hint": "You rest your head on it", "emoji": "🛏️"},
    {"name": "Remote", "hint": "You use it to change TV channels", "emoji": "📺"},
    {"name": "Toothbrush", "hint": "You clean your teeth with it", "emoji": "🪥"},
    {"name": "Comb", "hint": "You use it on your hair", "emoji": "💇"},
]

# Points config
POINTS_PER_FIND = 10
BONUS_POINTS_STREAK = 5


@router.get("/challenge", response_model=FinderChallengeResponse)
async def get_challenge():
    """
    Get a random object for the kid to find.
    """
    obj = random.choice(FINDER_OBJECTS)
    return FinderChallengeResponse(
        target_object=obj["name"],
        hint=obj["hint"],
        emoji=obj["emoji"],
    )


@router.post("/verify", response_model=FinderVerifyResponse)
async def verify_challenge(
    request: FinderVerifyRequest,
    db: Session = Depends(get_db),
):
    """
    Verify if the kid found the correct object.
    Awards points on success.
    """
    is_match = await verify_object(request.image_base64, request.target_object)

    if is_match:
        points = POINTS_PER_FIND
        message = f"🎉 Amazing! You found the {request.target_object}! +{points} points!"

        # Save the challenge
        challenge = models.FinderChallenge(
            target_object=request.target_object,
            is_completed=True,
            points_earned=points,
            completed_at=datetime.now(timezone.utc),
        )
        db.add(challenge)
        db.commit()

        return FinderVerifyResponse(
            is_match=True,
            points_earned=points,
            message=message,
        )
    else:
        return FinderVerifyResponse(
            is_match=False,
            points_earned=0,
            message=f"Hmm, that doesn't look like a {request.target_object}. Keep looking! 🔍",
        )
