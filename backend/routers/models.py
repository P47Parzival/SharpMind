from fastapi import APIRouter, HTTPException, Request

from schemas.models import SketchfabFetchRequest, SketchfabFetchResponse
from services.sketchfab_service import SketchfabError, fetch_model_from_sketchfab

router = APIRouter(prefix="/models", tags=["3D Models"])


@router.post("/sketchfab/fetch", response_model=SketchfabFetchResponse)
async def sketchfab_fetch_model(payload: SketchfabFetchRequest, request: Request):
    try:
        return await fetch_model_from_sketchfab(payload.query, str(request.base_url))
    except SketchfabError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch model: {exc}")
