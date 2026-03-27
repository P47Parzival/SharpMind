import { Audio } from "expo-audio";

let currentSound: Audio.Sound | null = null;

/**
 * Play audio from a URL (used for TTS playback)
 */
export async function playAudioFromUrl(url: string): Promise<void> {
  try {
    // Stop any currently playing audio
    await stopAudio();

    const player = Audio.createPlayer(url);
    await player.play();

    // Store reference for cleanup — expo-audio uses a different API
    // but we keep a simple reference
    currentSound = player as any;
  } catch (error) {
    console.error("Audio playback error:", error);
  }
}

/**
 * Stop currently playing audio
 */
export async function stopAudio(): Promise<void> {
  if (currentSound) {
    try {
      (currentSound as any).remove?.();
    } catch (e) {
      // Ignore errors during cleanup
    }
    currentSound = null;
  }
}
