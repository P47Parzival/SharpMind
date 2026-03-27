from pydantic import BaseModel
from typing import Optional


# --- Object Detection ---
class DetectionRequest(BaseModel):
    image_base64: str
    language: str = "English"


class DetectionResponse(BaseModel):
    object_name: str
    description: str
    audio_url: Optional[str] = None


# --- Object Finder ---
class FinderChallengeResponse(BaseModel):
    target_object: str
    hint: str
    emoji: str


class FinderVerifyRequest(BaseModel):
    image_base64: str
    target_object: str


class FinderVerifyResponse(BaseModel):
    is_match: bool
    points_earned: int
    message: str


# --- User ---
class UserCreate(BaseModel):
    display_name: str
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    display_name: str
    total_points: int
    streak_count: int

    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    id: int
    display_name: str
    total_points: int
    streak_count: int
    objects_detected: int
    challenges_completed: int


# --- Vocab Voice Coach ---
class PronunciationRequest(BaseModel):
    target_word: str
    audio_base64: str


class PronunciationResponse(BaseModel):
    is_correct: bool
    feedback: str
    points_earned: int
