from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, SessionLocal
import models

from routers import detection, finder, users, vocab, models as model_router

DOWNLOADS_DIR = Path(__file__).resolve().parent / "downloaded_models"
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SharpMind API",
    description="AR Vocabulary Learning App Backend",
    version="1.0.0",
)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Create a default user for the hackathon if it doesn't exist
        default_user = db.query(models.User).filter(models.User.id == 1).first()
        if not default_user:
            default_user = models.User(id=1, display_name="Explorer", total_points=0, streak_count=1)
            db.add(default_user)
            db.commit()
            print("Default user (ID: 1) created.")
    finally:
        db.close()


# CORS - allow React Native / Expo requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/downloaded-models", StaticFiles(directory=str(DOWNLOADS_DIR)), name="downloaded-models")

# Include routers
app.include_router(detection.router)
app.include_router(finder.router)
app.include_router(users.router)
app.include_router(vocab.router)
app.include_router(model_router.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to SharpMind API! 🧠",
        "docs": "/docs",
        "endpoints": {
            "detect": "POST /detect/",
            "finder_challenge": "GET /finder/challenge",
            "finder_verify": "POST /finder/verify",
            "create_user": "POST /users/",
            "user_stats": "GET /users/{id}/stats",
            "vocab_pronounce": "POST /vocab/pronounce",
            "sketchfab_fetch": "POST /models/sketchfab/fetch",
        },
    }
