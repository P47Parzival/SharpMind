// Backend API base URL - change this to your backend IP when testing on device
// For Android emulator use 10.0.2.2, for iOS simulator use localhost
const API_BASE_URL = "http://10.0.2.2:8000";

export const api = {
  /**
   * Detect an object from a base64-encoded image
   */
  async detectObject(imageBase64: string) {
    const response = await fetch(`${API_BASE_URL}/detect/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64 }),
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
};
