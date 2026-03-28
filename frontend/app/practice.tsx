import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { Mic, Square, ArrowLeft, Trophy } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ConfettiCannon from "react-native-confetti-cannon";
import { api } from "../services/api";

function FloatEmoji({ style, duration, size, emoji, floatRange = 14 }: { style?: any; duration: number; size: number; emoji: string; floatRange?: number; }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -floatRange] });
  const rotate = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["-8deg", "8deg", "-8deg"] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] });
  return <Animated.Text style={[{ position: "absolute", fontSize: size, transform: [{ translateY }, { rotate }, { scale }] }, style]}>{emoji}</Animated.Text>;
}

export default function PracticeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { word, emoji } = useLocalSearchParams<{ word: string; emoji: string }>();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        if (recording) {
          try { await recording.stopAndUnloadAsync(); } catch (e) {}
        }
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
          ])
        ).start();

        const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(newRecording);
        setIsRecording(true);
        setFeedback(null);
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      setFeedback("Oops! Could not start the microphone.");
      setIsSuccess(false);
      showFeedback();
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    setIsAnalyzing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri && word) {
        const result = await api.checkPronunciation(word, uri);
        setIsSuccess(result.is_correct);
        setFeedback(result.feedback);
        Speech.speak(result.feedback, { rate: 0.95, pitch: 1.1 });
      }
    } catch (err) {
      console.error("Analysis failed", err);
      setFeedback("Sorry, I had trouble hearing that. Try again!");
      setIsSuccess(false);
      Speech.speak("Sorry, I had trouble hearing that. Try again!", { rate: 0.95, pitch: 1.1 });
    } finally {
      setIsAnalyzing(false);
      setRecording(null);
      showFeedback();
    }
  };

  const showFeedback = () => {
    resultScaleAnim.setValue(0.5);
    Animated.spring(resultScaleAnim, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.container}>
      {isSuccess && <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} fadeOut={true} />}
      
      {/* Deep space gradient */}
      <LinearGradient colors={["#0D001F", "#220050", "#4A0099", "#7B1FD4"]} style={StyleSheet.absoluteFillObject} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <View style={styles.radialGlow} />

      <FloatEmoji emoji="✨" size={24} style={{ top: 100, left: 30 }} duration={2000} floatRange={12} />
      <FloatEmoji emoji="🗣️" size={32} style={{ top: 130, right: 30 }} duration={2500} floatRange={18} />

      {/* Header */}
      <View style={[styles.headerOuter, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#FFF" size={26} />
          </TouchableOpacity>
        </View>

        <View style={styles.titlePill}>
          <Text style={styles.titlePillTxt}>Focus and Speak! 🎙️</Text>
        </View>
      </View>

      <View style={styles.curveContainer}>
        <View style={styles.curveBg} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Word Card */}
        <View style={styles.wordCardWrap}>
          <View style={styles.wordCardShadow} />
          <LinearGradient colors={["#FFD93D", "#FFA500", "#E07B00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wordCard}>
            <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.targetWord}>{word}</Text>
          </LinearGradient>
        </View>

        {isAnalyzing ? (
           <View style={styles.processingBox}>
             <View style={styles.spinnerBlob}>
               <ActivityIndicator size="large" color="#FFD93D" />
             </View>
             <Text style={styles.processingTxt}>AI is listening... 🧠</Text>
           </View>
        ) : feedback ? (
          <Animated.View style={[styles.feedbackWrap, { transform: [{ scale: resultScaleAnim }] }]}>
            <View style={[styles.feedbackShadow, { backgroundColor: isSuccess ? "#008A4D" : "#9D003F" }]} />
            <LinearGradient colors={isSuccess ? ["#2ECC71", "#00A86B"] : ["#FF6B6B", "#FF3E88"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.feedbackCard}>
              <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
              <Text style={styles.feedbackText}>{feedback}</Text>
              {isSuccess && (
                <View style={styles.pointsBadge}>
                  <Trophy color="#FFD700" size={16} />
                  <Text style={styles.pointsText}>+5 Points</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        ) : (
          <View style={styles.instructionWrap}>
             <Text style={styles.instructionText}>Hold the mic to talk!</Text>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
         <View style={{ alignItems: 'center' }}>
            <Animated.View style={[styles.micGlow, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }]} />
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                disabled={isAnalyzing}
                style={[styles.micButtonWrap, isAnalyzing && { opacity: 0.5 }]}
            >
                <View style={[styles.micShadow, isRecording && { bottom: -2, height: '98%' }]} />
                <LinearGradient 
                    colors={isRecording ? ["#FF3E88", "#C2006F"] : ["#A855F7", "#7C3AED"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.micButton, isRecording && { transform: [{ translateY: 4 }] }]}
                >
                    <LinearGradient colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
                    {isRecording ? <Square color="#FFF" size={44} fill="#FFF" /> : <Mic size={54} color="#FFF" />}
                </LinearGradient>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0EBF8" },
  radialGlow: { position: "absolute", top: -80, alignSelf: "center", left: "10%", width: 320, height: 320, borderRadius: 160, backgroundColor: "#8B00FF", opacity: 0.35 },

  headerOuter: { paddingBottom: 40, paddingHorizontal: 22, overflow: "visible", zIndex: 10, alignItems: "center" },
  headerNav: { width: "100%", flexDirection: "row", justifyContent: "flex-start", marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  titlePill: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  titlePillTxt: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5 },

  curveContainer: { height: 28, overflow: "visible", zIndex: 5 },
  curveBg: { position: "absolute", bottom: 0, left: -20, right: -20, height: 60, backgroundColor: "#F0EBF8", borderTopLeftRadius: 36, borderTopRightRadius: 36 },

  scroll: { flex: 1, backgroundColor: "#F0EBF8" },
  content: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40, alignItems: "center" },

  wordCardWrap: { position: "relative", width: "100%", marginBottom: 40, zIndex: 5 },
  wordCardShadow: { position: "absolute", bottom: -8, left: 6, right: 6, height: "100%", borderRadius: 32, backgroundColor: "#B85E00", opacity: 0.9 },
  wordCard: { borderRadius: 32, padding: 40, alignItems: "center", borderWidth: 3, borderColor: "#FFFFFF", overflow: "hidden" },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", borderTopLeftRadius: 30, borderTopRightRadius: 30 },

  emoji: { fontSize: 80, marginBottom: 16 },
  targetWord: { fontSize: 48, fontWeight: "900", color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  instructionWrap: { backgroundColor: "rgba(139, 0, 255, 0.08)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: "rgba(139, 0, 255, 0.15)" },
  instructionText: { fontSize: 18, color: "#4A0099", fontWeight: "800" },

  feedbackWrap: { position: "relative", width: "100%", marginBottom: 20 },
  feedbackShadow: { position: "absolute", bottom: -5, left: 4, right: 4, height: "100%", borderRadius: 24, backgroundColor: "rgba(0,0,0,0.15)" },
  feedbackCard: { borderRadius: 24, padding: 24, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", alignItems: "center", overflow: "hidden" },
  feedbackText: { fontSize: 22, color: "#FFFFFF", fontWeight: "900", textAlign: "center", marginBottom: 12, textShadowColor: "rgba(0,0,0,0.2)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  pointsBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, gap: 6 },
  pointsText: { color: "#FFD700", fontWeight: "900", fontSize: 16 },

  processingBox: { alignItems: 'center', gap: 16 },
  spinnerBlob: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#7B1FD4", alignItems: "center", justifyContent: "center", shadowColor: "#4A0099", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  processingTxt: { fontSize: 18, fontWeight: '800', color: '#6C63FF' },

  footer: { alignItems: "center", paddingBottom: 40, paddingTop: 10, backgroundColor: "#F0EBF8" },
  micButtonWrap: { position: "relative", width: 120, height: 120, zIndex: 10 },
  micShadow: { position: "absolute", bottom: -8, left: 4, right: 4, height: "100%", borderRadius: 60, backgroundColor: "rgba(0,0,0,0.3)" },
  micButton: { flex: 1, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: "rgba(255,255,255,0.6)", overflow: "hidden" },
  micGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFD93D', top: -40, zIndex: 1 },
});
