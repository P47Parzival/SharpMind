"""
VAPI TTS service - now handled on the frontend.

VAPI is a voice agent platform that creates real-time voice calls.
The correct integration is:
- PUBLIC key → frontend (@vapi-ai/react-native SDK) for voice calls
- PRIVATE key → backend API for managing assistants/calls (optional)

For SharpMind, VAPI runs entirely on the frontend:
1. expo-speech handles instant device TTS
2. @vapi-ai/react-native creates interactive voice sessions

This backend module is kept as a placeholder for future server-side
VAPI operations (e.g., analytics, call logging).
"""


async def generate_speech_for_object(object_name: str, description: str) -> str | None:
    """
    Returns None — TTS is now handled on the frontend via:
    1. expo-speech (instant device TTS)
    2. @vapi-ai/react-native (interactive voice teaching)
    """
    # VAPI integration moved to frontend/services/vapi.ts
    # This returns None so the detection endpoint still works
    return None
