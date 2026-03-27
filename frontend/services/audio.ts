import * as Speech from "expo-speech";

/**
 * Speak text using the device's built-in TTS (expo-speech).
 * This works instantly, offline, and on all devices.
 */
export function speakText(text: string, language: string = "en"): void {
  // Stop any currently playing speech
  Speech.stop();

  Speech.speak(text, {
    language,
    pitch: 1.1, // Slightly higher pitch for kid-friendly voice
    rate: 0.85, // Slightly slower for clarity
    onError: (error) => {
      console.error("Speech error:", error);
    },
  });
}

/**
 * Speak the object name and description
 */
export function speakObjectDescription(
  objectName: string,
  description: string,
  languageCode: string = "en-US"
): void {
  const speech = `${objectName}. ${description}`;
  speakText(speech, languageCode);
}

/**
 * Stop any currently playing speech
 */
export function stopSpeaking(): void {
  Speech.stop();
}

/**
 * Check if the device is currently speaking
 */
export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
