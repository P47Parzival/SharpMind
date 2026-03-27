import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Volume2, Camera } from "lucide-react-native";
import { COLORS } from "../constants/app";
import { speakObjectDescription, stopSpeaking } from "../services/audio";

export default function ResultScreen() {
  const { objectName, description } = useLocalSearchParams<{
    objectName: string;
    description: string;
  }>();
  const router = useRouter();

  // Auto-speak the description when the screen loads (device TTS)
  useEffect(() => {
    if (objectName && description) {
      speakObjectDescription(objectName, description);
    }

    return () => {
      stopSpeaking();
    };
  }, [objectName, description]);

  const handleSpeak = () => {
    if (objectName && description) {
      speakObjectDescription(objectName, description);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            stopSpeaking();
            router.back();
          }}
        >
          <ArrowLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Object Detected! 🎉</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Object Card */}
        <View style={styles.objectCard}>
          <View style={styles.objectIconContainer}>
            <Text style={styles.objectIcon}>🔍</Text>
          </View>
          <Text style={styles.objectName}>{objectName || "Unknown"}</Text>
        </View>

        {/* Description Card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>📝 About this object</Text>
          <Text style={styles.descriptionText}>
            {description || "No description available."}
          </Text>
        </View>

        {/* Speak Button - device TTS (always works) */}
        <TouchableOpacity
          style={styles.audioButton}
          onPress={handleSpeak}
          activeOpacity={0.8}
        >
          <Volume2 color="#FFFFFF" size={24} />
          <Text style={styles.audioButtonText}>🔊 Hear Description Again</Text>
        </TouchableOpacity>

        {/* Points Earned */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsEmoji}>⭐</Text>
          <Text style={styles.pointsText}>+5 Points Earned!</Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => {
            stopSpeaking();
            router.back();
          }}
          activeOpacity={0.85}
        >
          <Camera color="#FFFFFF" size={20} />
          <Text style={styles.primaryActionText}>Detect Another Object</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => {
            stopSpeaking();
            router.push("/");
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryActionText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  objectCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  objectIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  objectIcon: {
    fontSize: 36,
  },
  objectName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  descriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  audioButton: {
    flexDirection: "row",
    backgroundColor: "#7C5CFC", // Purple for the voice 
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    shadowColor: "#7C5CFC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  audioButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  pointsCard: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF8E1",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  pointsEmoji: {
    fontSize: 24,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F57F17",
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  primaryAction: {
    flexDirection: "row",
    backgroundColor: COLORS.success,
    borderRadius: 18,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryAction: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryActionText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});
