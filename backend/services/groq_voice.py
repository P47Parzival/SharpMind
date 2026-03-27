import os
import tempfile
import base64
import json
from services.groq_vision import get_groq_client


async def evaluate_pronunciation(target_word: str, audio_base64: str) -> dict:
    """
    1. Decode audio_base64 to a temporary file.
    2. Use Groq Whisper to transcribe it.
    3. Use Groq LLaMA to evaluate if the transcription matches the target word.
    """
    client = get_groq_client()
    
    # 1. Save audio to temp file
    # React Native expo-av typically records in .m4a format on iOS and varying formats on Android.
    # We will save it as .m4a which Whisper supports
    audio_bytes = base64.b64decode(audio_base64)
    with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as temp_audio:
        temp_audio.write(audio_bytes)
        temp_audio_path = temp_audio.name

    try:
        # 2. Transcribe with Whisper
        with open(temp_audio_path, "rb") as file_to_transcribe:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(temp_audio_path), file_to_transcribe.read()),
                model="whisper-large-v3-turbo",
            )
            
        transcript = transcription.text.strip()
        print(f"Target: {target_word} | Transcript: {transcript}")

        # 3. Evaluate with LLaMA
        prompt = f"""You are a fun, encouraging voice coach for a 5-year-old child.
The child is practicing saying the word: "{target_word}".

We recorded their voice and the transcriber heard: "{transcript}".

Did the child pronounce it correctly? (It doesn't have to be perfect, just phonetically close or exact).
If correct, give them excited praise!
If incorrect, gently encourage them and ask them to try saying "{target_word}" again.

Respond ONLY in this exact JSON format:
{{"is_correct": true/false, "feedback": "your kid-friendly feedback here"}}
"""
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.3, # Low temp for consistent JSON
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Robust JSON extraction
        json_start = result_text.find("{")
        json_end = result_text.rfind("}") + 1
        if json_start != -1 and json_end != 0:
            result_text = result_text[json_start:json_end]
            
        try:
            result = json.loads(result_text)
            return {
                "is_correct": result.get("is_correct", False),
                "feedback": result.get("feedback", "I couldn't quite hear that. Let's try again!"),
                "transcript": transcript
            }
        except json.JSONDecodeError:
            # Fallback
            return {
                "is_correct": False,
                "feedback": "I had trouble hearing you clearly. Can you try saying it again nice and loud?",
                "transcript": transcript
            }

    except Exception as e:
        print(f"Groq Audio Error: {e}")
        return {
            "is_correct": False,
            "feedback": "Oops, my ears stopped working for a second! Try one more time?",
            "transcript": ""
        }
    finally:
        # Clean up temp file
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
