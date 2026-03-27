from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="IITRAM API")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to IITRAM Backend API!"}

@app.get("/users/")
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users
