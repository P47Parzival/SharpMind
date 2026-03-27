from sqlalchemy.orm import Session
from datetime import datetime, timezone
import models

def award_points_and_update_streak(db: Session, user_id: int, points: int):
    """
    Award points to the user and recalculate the day streak based on last_active.
    - If the user is active on a new consecutive day, streak +1.
    - If the user missed a day or more, streak resets to 1.
    - If it's the same day, streak stays the same.
    Updates last_active to current time.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None

    now = datetime.now(timezone.utc)
    
    if user.last_active:
        # Calculate difference in calendar days (UTC)
        # Using date() ignores the time component
        last_date = user.last_active.date()
        current_date = now.date()
        
        delta_days = (current_date - last_date).days
        
        if delta_days == 1:
            # Consecutive day!
            user.streak_count += 1
        elif delta_days > 1:
            # Streak broken, start fresh at 1 for today
            user.streak_count = 1
        # if delta_days == 0, it's the same day, leave streak unchanged
    else:
        # First active time
        user.streak_count = 1

    user.total_points += points
    user.last_active = now

    db.commit()
    return user
