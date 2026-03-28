from pydantic import BaseModel, Field


class SketchfabFetchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=100)


class SketchfabFetchResponse(BaseModel):
    source: str
    model_name: str
    model_type: str
    model_url: str
    uid: str
