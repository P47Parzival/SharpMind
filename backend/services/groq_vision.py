import base64
import json
import re
from groq import Groq
from config import get_settings


def get_groq_client() -> Groq:
    settings = get_settings()
    return Groq(api_key=settings.GROQ_API_KEY)


def _clean_markdown_wrappers(text: str) -> str:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _extract_json_objects(text: str) -> list[str]:
    """Return JSON-like brace blocks from text, outer blocks first."""
    blocks: list[str] = []
    stack: list[int] = []
    for idx, ch in enumerate(text):
        if ch == "{":
            stack.append(idx)
        elif ch == "}" and stack:
            start = stack.pop()
            blocks.append(text[start : idx + 1])
    blocks.sort(key=len, reverse=True)
    return blocks


def _normalize_fields(obj_name: str, desc: str) -> dict:
    object_name = (obj_name or "").strip()
    description = (desc or "").strip()

    if not object_name:
        object_name = "Detected Object"
    if not description:
        description = "I found an object, but could not generate a full description this time."

    return {
        "object_name": object_name,
        "description": description,
    }


def _extract_from_dict(payload: dict) -> dict | None:
    object_keys = ["object_name", "obiect_name", "object", "name"]
    description_keys = ["description", "about", "details"]

    obj_name = ""
    desc = ""

    for key in object_keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            obj_name = value
            break

    for key in description_keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            desc = value
            break

    if not obj_name and not desc:
        return None

    return _normalize_fields(obj_name, desc)


def _extract_from_text_fallback(text: str) -> dict:
    # Accept common key typo "obiect_name" and both quote styles.
    obj_match = re.search(
        r"[\"'](?:object_name|obiect_name)[\"']\s*:\s*[\"']([^\"']{1,140})[\"']",
        text,
        flags=re.IGNORECASE,
    )
    desc_match = re.search(
        r"[\"']description[\"']\s*:\s*[\"']([\s\S]{8,2000}?)[\"'](?=\s*[,}])",
        text,
        flags=re.IGNORECASE,
    )

    obj_name = obj_match.group(1).strip() if obj_match else ""
    desc = desc_match.group(1).strip() if desc_match else ""

    return _normalize_fields(obj_name, desc)


def _parse_detection_result(raw_text: str) -> dict:
    cleaned = _clean_markdown_wrappers(raw_text)

    # 1) Fast path: full payload is valid JSON.
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            extracted = _extract_from_dict(parsed)
            if extracted:
                return extracted
    except json.JSONDecodeError:
        pass

    # 2) Try each JSON-like block found in a mixed response.
    for candidate in _extract_json_objects(cleaned):
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                extracted = _extract_from_dict(parsed)
                if extracted:
                    return extracted
        except json.JSONDecodeError:
            continue

    # 3) Last-resort regex extraction from malformed output.
    return _extract_from_text_fallback(cleaned)


async def detect_object(image_base64: str, language: str = "English") -> dict:
    """
    Send an image to Groq Vision API to identify the object
    and generate a kid-friendly description.
    """
    client = get_groq_client()

    # Build the prompt for kid-friendly output
    prompt = f"""You are a friendly teacher for young children (ages 4-10). 
Look at this image and:
1. Identify the main object in the image.
2. Write a fun, simple, 2-3 sentence description that a kid would understand.
3. Include one interesting fact about the object.

IMPORTANT: You MUST write the 'object_name' and 'description' in {language}.

Respond ONLY in this exact JSON format (no markdown, no code blocks):
{{"object_name": "name of the object in {language}", "description": "your kid-friendly description in {language}"}}
"""

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                            },
                        },
                    ],
                }
            ],
            max_tokens=300,
            temperature=0.2,
        )

        result_text = response.choices[0].message.content.strip()
        return _parse_detection_result(result_text)

    except Exception as e:
        print(f"Groq Vision API error: {e}")
        return {
            "object_name": "Error",
            "description": f"Oops! Something went wrong. Please try again.",
        }


async def verify_object(image_base64: str, target_object: str) -> bool:
    """
    Verify if the image contains the target object (for Object Finder game).
    """
    client = get_groq_client()

    prompt = f"""Look at this image carefully. 
Does this image contain a "{target_object}"? 

Respond with ONLY "yes" or "no" (nothing else).
"""

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                            },
                        },
                    ],
                }
            ],
            max_tokens=10,
            temperature=0.1,
        )

        answer = response.choices[0].message.content.strip().lower()
        return "yes" in answer

    except Exception as e:
        print(f"Groq Vision verify error: {e}")
        return False
