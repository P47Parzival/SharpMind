from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from schemas.detection import DetectionRequest, DetectionResponse
from services.groq_vision import detect_object
from services.vapi_tts import generate_speech_for_object
from database import SessionLocal
import models

router = APIRouter(prefix="/detect", tags=["Object Detection"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=DetectionResponse)
async def detect_object_endpoint(
    request: DetectionRequest,
    db: Session = Depends(get_db),
):
    """
    Detect an object from a base64-encoded image.
    Returns the object name, kid-friendly description, and audio URL.
    """
    # Step 1: Identify object with Groq Vision
    result = await detect_object(request.image_base64)

    object_name = result["object_name"]
    description = result["description"]

    # Step 2: Generate speech with VAPI TTS
    audio_url = await generate_speech_for_object(object_name, description)

    # Step 3: Save to database
    detected = models.DetectedObject(
        object_name=object_name,
        description=description,
    )
    db.add(detected)
    db.commit()

    return DetectionResponse(
        object_name=object_name,
        description=description,
        audio_url=audio_url,
    )
