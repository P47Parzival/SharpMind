import httpx
import base64
import os
from config import get_settings


async def generate_speech_for_object(object_name: str, description: str) -> str | None:
    """
    Generate speech audio for the detected object using VAPI.
    
    VAPI is a voice agent platform. We use their API to create a 
    short assistant that speaks the description. However, for simple 
    TTS in a mobile app, we now return the text and let the frontend 
    handle speech via:
    1. expo-speech (built-in device TTS) for instant pronunciation
    2. VAPI Web SDK for interactive voice teaching (optional)
    
    This function attempts to use VAPI's API. If not available,
    the frontend falls back to device TTS.
    """
    settings = get_settings()

    if not settings.VAPI_API_KEY:
        print("VAPI_API_KEY not configured, frontend will use device TTS")
        return None

    speech_text = f"This is a {object_name}! {description}"

    headers = {
        "Authorization": f"Bearer {settings.VAPI_API_KEY}",
        "Content-Type": "application/json",
    }

    # Create a VAPI assistant that speaks the description
    # Using VAPI's create-call API with type "webCall"
    payload = {
        "assistant": {
            "firstMessage": speech_text,
            "model": {
                "provider": "groq",
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a friendly vocabulary teacher for kids. "
                            "You just described an object. If the child asks "
                            "anything, answer in a fun, simple way. Keep "
                            "responses very short (1-2 sentences)."
                        ),
                    }
                ],
            },
            "voice": {
                "provider": "vapi",
                "voiceId": "Elliot",
            },
            "endCallMessage": "Bye bye! Keep learning!",
            "maxDurationSeconds": 60,
        },
        "type": "webCall",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.vapi.ai/call",
                headers=headers,
                json=payload,
            )

            if response.status_code in (200, 201):
                result = response.json()
                # Return the web call URL that the frontend can connect to
                web_call_url = result.get("webCallUrl", None)
                call_id = result.get("id", None)
                print(f"VAPI call created: {call_id}")
                return web_call_url
            else:
                print(f"VAPI error: {response.status_code} - {response.text}")
                return None

    except Exception as e:
        print(f"VAPI request failed: {e}")
        return None
