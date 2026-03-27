import httpx
from config import get_settings


async def generate_speech(text: str, voice: str = "jennifer") -> str | None:
    """
    Call VAPI's text-to-speech API to generate audio from text.
    
    Returns the audio URL or None on failure.
    
    Note: VAPI is primarily a voice AI agent platform. For direct TTS,
    we use their API to generate speech audio. If VAPI's direct TTS 
    endpoint isn't available, this can be swapped with another TTS 
    provider (e.g., ElevenLabs, Google TTS).
    """
    settings = get_settings()

    if not settings.VAPI_API_KEY:
        print("VAPI_API_KEY not configured, skipping TTS")
        return None

    headers = {
        "Authorization": f"Bearer {settings.VAPI_API_KEY}",
        "Content-Type": "application/json",
    }

    # VAPI TTS endpoint - adjust based on actual VAPI API docs
    # This is a common pattern for VAPI's speech synthesis
    payload = {
        "text": text,
        "voice": voice,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.vapi.ai/tts/generate",
                headers=headers,
                json=payload,
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("audio_url", None)
            else:
                print(f"VAPI TTS error: {response.status_code} - {response.text}")
                return None

    except Exception as e:
        print(f"VAPI TTS request failed: {e}")
        return None


async def generate_speech_for_object(object_name: str, description: str) -> str | None:
    """
    Generate a speech-friendly text and convert to audio.
    Formats the text in a way that sounds good when spoken aloud.
    """
    speech_text = (
        f"This is a {object_name}! {description}"
    )
    return await generate_speech(speech_text)
