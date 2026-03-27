import { Audio } from "expo-av";

let currentSound: Audio.Sound | null = null;

/**
 * Play audio from a URL (used for TTS playback)
 */
export async function playAudioFromUrl(url: string): Promise<void> {
  try {
    // Stop any currently playing audio
    await stopAudio();

    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    );

    currentSound = sound;

    // Clean up when playback finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        currentSound = null;
      }
    });
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
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (e) {
      // Ignore errors during cleanup
    }
    currentSound = null;
  }
}

/**
 * Set up audio mode for the app
 */
export async function setupAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });
}
