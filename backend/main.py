from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models

from routers import detection, finder, users

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SharpMind API",
    description="AR Vocabulary Learning App Backend",
    version="1.0.0",
)

# CORS - allow React Native / Expo requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(detection.router)
app.include_router(finder.router)
app.include_router(users.router)


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
        },
    }
