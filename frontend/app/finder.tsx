import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ArrowLeft, RefreshCw } from "lucide-react-native";
import { COLORS } from "../constants/app";
import { api } from "../services/api";

export default function FinderScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [challenge, setChallenge] = useState<{
    target_object: string;
    hint: string;
    emoji: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<{
    is_match: boolean;
    message: string;
    points_earned: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchChallenge();
  }, []);

  useEffect(() => {
    if (!challenge || result || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResult({
            is_match: false,
            message: "⏰ Time's up! Don't worry, try again!",
            points_earned: 0,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge, result]);

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  const fetchChallenge = async () => {
    setIsLoading(true);
    setResult(null);
    setTimeLeft(30);
    try {
      const data = await api.getFinderChallenge();
      setChallenge(data);
    } catch (error) {
      Alert.alert("Error", "Couldn't load challenge. Check your connection!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isVerifying || !challenge) return;

    setIsVerifying(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (photo?.base64) {
        const data = await api.verifyFinderObject(
          photo.base64,
          challenge.target_object
        );
        setResult(data);
      }
    } catch (error) {
      Alert.alert("Oops!", "Something went wrong. Try again!");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permTitle}>📸 Camera Access Needed</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera as flat layer — no children */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* All overlays on top */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <Text
              style={[
                styles.timerText,
                timeLeft <= 10 && { color: COLORS.danger },
              ]}
            >
              ⏱ {timeLeft}s
            </Text>
          </View>
        </View>

        {/* Challenge Prompt */}
        {challenge && !result && (
          <View style={styles.challengeCard}>
            <Animated.Text
              style={[
                styles.challengeEmoji,
                { transform: [{ scale: bounceAnim }] },
              ]}
            >
              {challenge.emoji}
            </Animated.Text>
            <Text style={styles.challengeTitle}>
              Find a {challenge.target_object}!
            </Text>
            <Text style={styles.challengeHint}>💡 {challenge.hint}</Text>
          </View>
        )}

        {/* Result Overlay */}
        {result && (
          <View style={styles.resultOverlay}>
            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: result.is_match ? "#E8FFF6" : "#FFF0F0",
                },
              ]}
            >
              <Text style={styles.resultEmoji}>
                {result.is_match ? "🎉" : "😅"}
              </Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.points_earned > 0 && (
                <Text style={styles.resultPoints}>
                  +{result.points_earned} points!
                </Text>
              )}
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={styles.resultButton}
                  onPress={fetchChallenge}
                >
                  <RefreshCw color="#FFFFFF" size={18} />
                  <Text style={styles.resultButtonText}>Next Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resultButton, styles.resultButtonSecondary]}
                  onPress={() => router.back()}
                >
                  <Text style={styles.resultButtonTextSecondary}>Go Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Capture Button */}
        {!result && (
          <View style={styles.bottomControls}>
            {isVerifying ? (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.verifyingText}>Checking... 🔍</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                activeOpacity={0.7}
              >
                <Text style={styles.captureText}>📸 I Found It!</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Getting your challenge...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 32,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  permButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  permButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  timerBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  challengeCard: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  challengeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  challengeHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  bottomControls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  captureText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  verifyingContainer: {
    alignItems: "center",
    gap: 10,
  },
  verifyingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 24,
  },
  resultCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  resultMessage: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 24,
  },
  resultPoints: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.success,
    marginBottom: 20,
  },
  resultActions: {
    width: "100%",
    gap: 10,
  },
  resultButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  resultButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  resultButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
  },
  resultButtonTextSecondary: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    gap: 12,
    zIndex: 2,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});
