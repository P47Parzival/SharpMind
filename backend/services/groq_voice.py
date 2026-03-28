import os
import tempfile
import base64
import json
import re
import unicodedata
from difflib import SequenceMatcher
from services.groq_vision import get_groq_client


LANGUAGE_HINTS = {
    "en-US": {"name": "English", "whisper": "en"},
    "es-ES": {"name": "Spanish", "whisper": "es"},
    "de-DE": {"name": "German", "whisper": "de"},
    "hi-IN": {"name": "Hindi", "whisper": "hi"},
}


def _normalize_text(value: str) -> str:
    text = (value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^\w\s\u0900-\u097F]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _is_reasonably_close(target_word: str, transcript: str, language_code: str) -> bool:
    target_norm = _normalize_text(target_word)
    trans_norm = _normalize_text(transcript)

    if not target_norm or not trans_norm:
        return False

    if target_norm in trans_norm or trans_norm in target_norm:
        return True

    ratio = SequenceMatcher(None, target_norm, trans_norm).ratio()
    threshold_map = {
        "en-US": 0.58,
        "es-ES": 0.52,
        "de-DE": 0.52,
        "hi-IN": 0.50,
    }
    threshold = threshold_map.get(language_code, 0.55)
    return ratio >= threshold


async def evaluate_pronunciation(target_word: str, audio_base64: str, language_code: str = "en-US") -> dict:
    """
    1. Decode audio_base64 to a temporary file.
    2. Use Groq Whisper to transcribe it.
    3. Use Groq LLaMA to evaluate if the transcription matches the target word.
    """
    client = get_groq_client()
    lang = LANGUAGE_HINTS.get(language_code, LANGUAGE_HINTS["en-US"])
    
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
                language=lang["whisper"],
            )
            
        transcript = transcription.text.strip()
        print(f"Target: {target_word} | Transcript: {transcript}")

        # 3. Evaluate with LLaMA
        prompt = f"""You are a fun, encouraging voice coach for a 5-year-old child.
    The child is practicing saying the word in {lang["name"]}: "{target_word}".

We recorded their voice and the transcriber heard: "{transcript}".

    Did the child pronounce it correctly?
    Be generous for children and language learners: if pronunciation is phonetically close, small mistakes, accent differences,
    or minor transcription errors, consider it correct.
If correct, give them excited praise!
If incorrect, gently encourage them and ask them to try saying "{target_word}" again.
    Write feedback in {lang["name"]}.

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
            llm_correct = bool(result.get("is_correct", False))
            heuristic_correct = _is_reasonably_close(target_word, transcript, language_code)
            final_correct = llm_correct or heuristic_correct

            if final_correct and not llm_correct:
                friendly_feedback = {
                    "en-US": f"Great try! That was close and understandable. You said {target_word} nicely!",
                    "es-ES": f"¡Muy bien! Estuvo muy cerca y se entendió bien. ¡Dijiste {target_word} muy bien!",
                    "de-DE": f"Sehr gut! Das war nah dran und gut verständlich. Du hast {target_word} gut gesagt!",
                    "hi-IN": f"बहुत बढ़िया! आपका उच्चारण काफी अच्छा और समझने योग्य था। आपने {target_word} अच्छा बोला!",
                }
                feedback = friendly_feedback.get(language_code, friendly_feedback["en-US"])
            else:
                feedback = result.get("feedback", "I couldn't quite hear that. Let's try again!")

            return {
                "is_correct": final_correct,
                "feedback": feedback,
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
