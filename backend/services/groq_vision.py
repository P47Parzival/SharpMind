import base64
import json
from groq import Groq
from config import get_settings


def get_groq_client() -> Groq:
    settings = get_settings()
    return Groq(api_key=settings.GROQ_API_KEY)


async def detect_object(image_base64: str) -> dict:
    """
    Send an image to Groq Vision API to identify the object
    and generate a kid-friendly description.
    """
    client = get_groq_client()

    # Build the prompt for kid-friendly output
    prompt = """You are a friendly teacher for young children (ages 4-10). 
Look at this image and:
1. Identify the main object in the image.
2. Write a fun, simple, 2-3 sentence description that a kid would understand.
3. Include one interesting fact about the object.

Respond ONLY in this exact JSON format (no markdown, no code blocks):
{"object_name": "name of the object", "description": "your kid-friendly description here"}
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
            temperature=0.7,
        )

        result_text = response.choices[0].message.content.strip()

        # Try to parse JSON from the response
        # Handle cases where the model wraps it in code blocks
        if "```" in result_text:
            # Extract JSON from code block
            json_start = result_text.find("{")
            json_end = result_text.rfind("}") + 1
            result_text = result_text[json_start:json_end]

        result = json.loads(result_text)
        return {
            "object_name": result.get("object_name", "Unknown Object"),
            "description": result.get("description", "I couldn't describe this object."),
        }

    except json.JSONDecodeError:
        # If JSON parsing fails, try to extract info from plain text
        return {
            "object_name": "Mystery Object",
            "description": result_text if result_text else "I see something interesting! Try again for a better look.",
        }
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
