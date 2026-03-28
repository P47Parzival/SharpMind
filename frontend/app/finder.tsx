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
import { LinearGradient } from "expo-linear-gradient";
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
  const resultScaleAnim = useRef(new Animated.Value(0.5)).current;
  const resultOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchChallenge();
  }, []);

  useEffect(() => {
    if (!challenge || result || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          showResult({
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
          toValue: 1.15,
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

  const showResult = (resData: any) => {
    setResult(resData);
    resultScaleAnim.setValue(0.5);
    resultOpacityAnim.setValue(0);
    Animated.parallel([
        Animated.spring(resultScaleAnim, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }),
        Animated.timing(resultOpacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

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
        showResult(data);
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
        <ActivityIndicator size="large" color="#FFD93D" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permEmoji}>📸</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <TouchableOpacity style={styles.permButtonWrap} onPress={requestPermission} activeOpacity={0.8}>
           <View style={styles.permButtonShadow} />
           <LinearGradient colors={["#A855F7", "#7C3AED"]} style={styles.permButton}>
             <Text style={styles.permButtonText}>Allow Camera</Text>
           </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButtonWrap} onPress={() => router.back()} activeOpacity={0.7}>
            <View style={styles.iconButtonShadow} />
            <View style={styles.iconButton}>
              <ArrowLeft color="#FFFFFF" size={24} />
            </View>
          </TouchableOpacity>

          <View style={[styles.timerBadge, timeLeft <= 10 && { backgroundColor: "#D80000", borderColor: "#FF4D4D" }]}>
            <Text style={styles.timerText}>
              ⏱ {timeLeft}s
            </Text>
          </View>
        </View>

        {challenge && !result && (
          <View style={styles.challengeCardWrap}>
             <View style={styles.challengeShadow} />
             <View style={styles.challengeCard}>
                <Animated.Text style={[styles.challengeEmoji, { transform: [{ scale: bounceAnim }] }]}>
                  {challenge.emoji}
                </Animated.Text>
                <Text style={styles.challengeTitle}>Find a {challenge.target_object}!</Text>
                <View style={styles.hintPill}>
                   <Text style={styles.challengeHint}>💡 {challenge.hint}</Text>
                </View>
             </View>
          </View>
        )}

        {result && (
          <View style={styles.resultOverlay}>
            <Animated.View style={[styles.resultCardWrap, { transform: [{ scale: resultScaleAnim }], opacity: resultOpacityAnim }]}>
              <View style={[styles.resultShadow, { backgroundColor: result.is_match ? "#008A4D" : "#9D003F" }]} />
              <LinearGradient
                  colors={result.is_match ? ["#2ECC71", "#00A86B", "#007A50"] : ["#FF6B6B", "#FF3E88", "#C2006F"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.resultCard}
              >
                <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
                <View style={styles.dotPattern} />

                <Text style={styles.resultEmoji}>{result.is_match ? "🎉" : "😅"}</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
                {result.points_earned > 0 && (
                  <View style={styles.ptsBadge}>
                    <Text style={styles.resultPoints}>+{result.points_earned} points!</Text>
                  </View>
                )}
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.actionBtnOutline} onPress={fetchChallenge}>
                    <RefreshCw color="#FFF" size={20} />
                    <Text style={styles.actionBtnTxtWhite}>Next Challenge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => router.back()}>
                    <Text style={styles.actionBtnTxt}>Go Home</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        )}

        {!result && (
          <View style={styles.bottomControls}>
            {isVerifying ? (
              <View style={styles.detectingBox}>
                <ActivityIndicator size="large" color="#FFD93D" />
                <Text style={styles.verifyingText}>Checking... 🔍</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureWrap} onPress={handleCapture} activeOpacity={0.9}>
                <View style={styles.captureShadow} />
                <LinearGradient colors={["#FFD93D", "#FFA500"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.captureOuter}>
                   <LinearGradient colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
                   <Text style={styles.captureText}>📸 I Found It!</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
           <View style={styles.spinnerBlob}>
             <ActivityIndicator size="large" color="#FFF" />
           </View>
           <Text style={styles.loadingText}>Loading challenge... 🎁</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D001F", padding: 32 },
  permEmoji: { fontSize: 64, marginBottom: 16 },
  permTitle: { fontSize: 24, fontWeight: "900", color: "#FFF", marginBottom: 32 },
  permButtonWrap: { position: "relative", width: "80%" },
  permButtonShadow: { position: "absolute", bottom: -6, left: 2, right: 2, height: "100%", backgroundColor: "#4C1D95", borderRadius: 24 },
  permButton: { paddingVertical: 18, borderRadius: 24, alignItems: "center", borderWidth: 2, borderColor: "#A855F7" },
  permButtonText: { color: "#FFF", fontSize: 18, fontWeight: "900" },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  iconButtonWrap: { position: "relative", width: 44, height: 44 },
  iconButtonShadow: { position: "absolute", bottom: -3, left: 1, right: 1, height: "100%", borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)" },
  iconButton: { flex: 1, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  timerBadge: { backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  timerText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },

  challengeCardWrap: { position: "absolute", top: 120, left: 20, right: 20, zIndex: 10 },
  challengeShadow: { position: "absolute", bottom: -6, left: 4, right: 4, height: "100%", borderRadius: 24, backgroundColor: "rgba(0,0,0,0.4)" },
  challengeCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 3, borderColor: "#FFD93D" },
  challengeEmoji: { fontSize: 56, marginBottom: 8 },
  challengeTitle: { fontSize: 28, fontWeight: "900", color: "#2D0060", marginBottom: 12, textAlign: "center" },
  hintPill: { backgroundColor: "#F0EBF8", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#D0BCE5" },
  challengeHint: { fontSize: 15, color: "#6B00CC", fontWeight: "700" },

  bottomControls: { position: "absolute", bottom: 60, left: 0, right: 0, alignItems: "center" },
  captureWrap: { position: "relative", paddingHorizontal: 20 },
  captureShadow: { position: "absolute", bottom: -6, left: 24, right: 24, height: "100%", borderRadius: 32, backgroundColor: "#C2006F" },
  captureOuter: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: 32, alignItems: "center", borderWidth: 4, borderColor: "#FFFFFF", overflow: "hidden" },
  captureText: { color: "#2D0060", fontSize: 22, fontWeight: "900" },

  detectingBox: { backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 24, paddingVertical: 16, borderRadius: 24, alignItems: "center", gap: 10, borderWidth: 2, borderColor: "#FFD93D" },
  verifyingText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },

  resultOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.7)" },
  resultCardWrap: { width: "100%", position: "relative" },
  resultShadow: { position: "absolute", bottom: -8, left: 6, right: 6, height: "100%", borderRadius: 32, opacity: 0.8 },
  resultCard: { width: "100%", padding: 32, borderRadius: 32, alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "50%" },
  dotPattern: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, borderRadius: 32 },

  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultMessage: { fontSize: 26, fontWeight: "900", color: "#FFF", textAlign: "center", marginBottom: 16, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  ptsBadge: { backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, marginBottom: 24 },
  resultPoints: { fontSize: 20, fontWeight: "900", color: "#FFD93D" },

  resultActions: { width: "100%", gap: 12 },
  actionBtnOutline: { width: "100%", paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  actionBtn: { width: "100%", paddingVertical: 16, borderRadius: 16, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  actionBtnTxtWhite: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  actionBtnTxt: { fontSize: 16, fontWeight: "900", color: "#000" },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "#0D001F", gap: 16, zIndex: 10 },
  spinnerBlob: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#7B1FD4", alignItems: "center", justifyContent: "center", shadowColor: "#4A0099", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  loadingText: { fontSize: 20, color: "#FFFFFF", fontWeight: "800" },
});
