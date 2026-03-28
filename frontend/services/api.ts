import * as FileSystem from 'expo-file-system/legacy';

// Backend API base URL - change this to your backend IP when testing on device
// For Android emulator use 10.0.2.2, for iOS simulator use localhost
// IMPORTANT: Use your laptop's WiFi IP when using Expo Go on a physical device
// Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_BASE_URL = "http://10.10.65.126:8000";
export const api = {
  /**
   * Detect an object from a base64-encoded image
   */
  async detectObject(imageBase64: string, language: string = "English") {
    const response = await fetch(`${API_BASE_URL}/detect/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64, language }),
    });

    if (!response.ok) {
      throw new Error(`Detection failed: ${response.status}`);
    }

    return response.json() as Promise<{
      object_name: string;
      description: string;
      audio_url: string | null;
    }>;
  },

  /**
   * Get a random object challenge for the Finder game
   */
  async getFinderChallenge() {
    const response = await fetch(`${API_BASE_URL}/finder/challenge`);

    if (!response.ok) {
      throw new Error(`Challenge fetch failed: ${response.status}`);
    }

    return response.json() as Promise<{
      target_object: string;
      hint: string;
      emoji: string;
    }>;
  },

  /**
   * Verify if the captured image matches the target object
   */
  async verifyFinderObject(imageBase64: string, targetObject: string) {
    const response = await fetch(`${API_BASE_URL}/finder/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: imageBase64,
        target_object: targetObject,
      }),
    });

    if (!response.ok) {
      throw new Error(`Verify failed: ${response.status}`);
    }

    return response.json() as Promise<{
      is_match: boolean;
      points_earned: number;
      message: string;
    }>;
  },

  /**
   * Create a new user
   */
  async createUser(displayName: string) {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName }),
    });

    if (!response.ok) {
      throw new Error(`User creation failed: ${response.status}`);
    }

    return response.json() as Promise<{
      id: number;
      display_name: string;
      total_points: number;
      streak_count: number;
    }>;
  },

  /**
   * Get user stats
   */
  async getUserStats(userId: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`);

    if (!response.ok) {
      throw new Error(`Stats fetch failed: ${response.status}`);
    }

    return response.json() as Promise<{
      id: number;
      display_name: string;
      total_points: number;
      streak_count: number;
      objects_detected: number;
      challenges_completed: number;
    }>;
  },

  /**
   * Check pronunciation of a word by uploading an audio base64 payload
   */
  async checkPronunciation(targetWord: string, audioUri: string, languageCode: string = "en-US") {
    // Read the recorded file directly to a Base64 string
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: 'base64',
    });

    const response = await fetch(`${API_BASE_URL}/vocab/pronounce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_word: targetWord,
        audio_base64: audioBase64,
        language_code: languageCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pronunciation check failed: ${response.status}`);
    }

    return response.json() as Promise<{
      is_correct: boolean;
      feedback: string;
      points_earned: number;
    }>;
  },

  /**
   * Deduct points from a user for redeeming rewards
   */
  async deductPoints(userId: number, amount: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/deduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error(`Failed to deduct points: ${response.status}`);
    }

    return response.json() as Promise<{
      status: string;
      new_total: number;
    }>;
  },

  /**
   * Fetch a downloadable 3D model from Sketchfab by search query.
   */
  async fetchSketchfabModel(query: string) {
    const response = await fetch(`${API_BASE_URL}/models/sketchfab/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      let detail = `Model fetch failed: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.detail) detail = errJson.detail;
      } catch {
        // Keep fallback detail
      }
      throw new Error(detail);
    }

    return response.json() as Promise<{
      source: string;
      model_name: string;
      model_type: string;
      model_url: string;
      uid: string;
    }>;
  },
};
