import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { Mic, Square, ArrowLeft, Trophy } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ConfettiCannon from "react-native-confetti-cannon";
import { api } from "../services/api";

export default function PracticeScreen() {
  const router = useRouter();
  const { word, emoji } = useLocalSearchParams<{ word: string; emoji: string }>();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Initial greeting
    if (word) {
      Speech.speak(`Let's practice! Say the word... ${word}`, { rate: 0.9, pitch: 1.1 });
    }
    return () => {
      Speech.stop();
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [word]);

  const startRecording = async () => {
    if (isRecording || isAnalyzing) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Ensure any previous dangling recording is destroyed
        if (recording) {
          try {
            await recording.stopAndUnloadAsync();
          } catch (e) {
            // Ignore if it's already unloaded
          }
        }

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        setIsRecording(true);
        setFeedback(null);
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      setFeedback("Oops! Could not start the microphone.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsAnalyzing(true);
    setFeedback("Listening closely...");

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri && word) {
        // Send to backend
        const result = await api.checkPronunciation(word, uri);
        
        setIsSuccess(result.is_correct);
        setFeedback(result.feedback);
        
        // Speak feedback
        Speech.speak(result.feedback, { rate: 0.95, pitch: 1.1 });
        
      }
    } catch (err) {
      console.error("Analysis failed", err);
      setFeedback("Sorry, I had trouble hearing that. Try again!");
      Speech.speak("Sorry, I had trouble hearing that. Try again!", { rate: 0.95, pitch: 1.1 });
    } finally {
      setIsAnalyzing(false);
      setRecording(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isSuccess && <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} fadeOut={true} />}
      
      <LinearGradient colors={["#FFE259", "#FFA751"]} style={styles.headerGlow} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#1E293B" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Coach</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.wordCard}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.targetWord}>{word}</Text>
          <Text style={styles.instruction}>
            {isSuccess ? "Perfect!" : "Tap & hold the mic to speak"}
          </Text>
        </View>

        {feedback && (
          <View style={[styles.feedbackBox, isSuccess && styles.feedbackSuccess]}>
            <Text style={styles.feedbackText}>{feedback}</Text>
            {isSuccess && (
              <View style={styles.pointsBadge}>
                <Trophy color="#F59E0B" size={16} />
                <Text style={styles.pointsText}>+5 Points</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingActive, isAnalyzing && styles.recordButtonDisabled]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
          disabled={isAnalyzing || isSuccess}
          activeOpacity={0.8}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#FFF" size="large" />
          ) : isRecording ? (
            <Square color="#FFF" size={40} fill="#FFF" />
          ) : (
            <Mic color="#FFF" size={48} />
          )}
        </TouchableOpacity>
        <Text style={styles.recordStatus}>
          {isAnalyzing ? "Analyzing..." : isRecording ? "Recording... Release to stop" : isSuccess ? "Great Job!" : "Hold to Talk"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  wordCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 32,
    width: "100%",
    shadowColor: "#FFA751",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  targetWord: {
    fontSize: 48,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 8,
  },
  instruction: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "500",
  },
  feedbackBox: {
    backgroundColor: "#F1F5F9",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  feedbackSuccess: {
    backgroundColor: "#ECFCCB",
    borderWidth: 2,
    borderColor: "#84CC16",
  },
  feedbackText: {
    fontSize: 18,
    color: "#334155",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 8,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    color: "#D97706",
    fontWeight: "700",
    marginLeft: 6,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  recordingActive: {
    backgroundColor: "#EF4444",
    transform: [{ scale: 1.1 }],
  },
  recordButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
  },
  recordStatus: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "600",
  },
});
