import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Volume2, Camera, Home } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { speakObjectDescription, stopSpeaking } from "../services/audio";

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

export default function ResultScreen() {
  const { objectName, description, languageCode } = useLocalSearchParams<{
    objectName: string;
    description: string;
    languageCode: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Auto-speak the description when the screen loads
  useEffect(() => {
    if (objectName && description) {
      speakObjectDescription(objectName, description, languageCode || "en-US");
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();

    return () => {
      stopSpeaking();
    };
  }, [objectName, description, languageCode]);

  const handleSpeak = () => {
    if (objectName && description) {
      speakObjectDescription(objectName, description, languageCode || "en-US");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deep Space Background */}
      <LinearGradient colors={["#0D001F", "#220050", "#4A0099", "#7B1FD4"]} style={StyleSheet.absoluteFillObject} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <View style={styles.radialGlow} />

      <FloatEmoji emoji="✨" size={24} style={{ top: 100, left: 30 }} duration={2000} floatRange={12} />
      <FloatEmoji emoji="🥳" size={32} style={{ top: 150, right: 30 }} duration={2500} floatRange={18} />
      <FloatEmoji emoji="🌟" size={18} style={{ top: 80, right: 90 }} duration={1800} floatRange={8} />

      {/* Header */}
      <View style={[styles.headerOuter, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => { stopSpeaking(); router.back(); }}
          >
            <ArrowLeft color="#FFF" size={26} />
          </TouchableOpacity>
        </View>

        <View style={styles.titlePill}>
          <Text style={styles.titlePillTxt}>Object Detected! 🎉</Text>
        </View>
      </View>

      <View style={styles.curveContainer}>
        <View style={styles.curveBg} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Animated Object Image Card */}
        <Animated.View style={[styles.objectCardWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.objectCardShadow} />
          <LinearGradient colors={["#A855F7", "#7C3AED", "#5B21B6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.objectCard}>
            <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
            <View style={styles.dotPattern} />
            <View style={styles.objectIconBlob} />
            <Text style={styles.objectIcon}>🔍</Text>
            <Text style={styles.objectName}>{objectName || "Unknown"}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Description Pill */}
        <View style={styles.descriptionCardWrap}>
          <View style={styles.descriptionShadow} />
          <View style={styles.descriptionCard}>
            <View style={styles.descIconBox}><Text style={styles.descIcon}>📝</Text></View>
            <View style={styles.descTexts}>
              <Text style={styles.descriptionTitle}>About this object</Text>
              <Text style={styles.descriptionText}>{description || "No description available."}</Text>
            </View>
          </View>
        </View>

        {/* Speak Button */}
        <TouchableOpacity style={styles.audioButtonWrap} onPress={handleSpeak} activeOpacity={0.8}>
           <View style={styles.audioButtonShadow} />
           <LinearGradient colors={["#FFD93D", "#FFA500", "#E07B00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.audioButton}>
              <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
              <Volume2 color="#FFF" size={24} />
              <Text style={styles.audioButtonText}>Hear Loud! 🔊</Text>
           </LinearGradient>
        </TouchableOpacity>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsEmoji}>⭐</Text>
          <Text style={styles.pointsText}>+5 Points Earned!</Text>
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.primaryActionWrap} onPress={() => { stopSpeaking(); router.back(); }} activeOpacity={0.9}>
            <View style={styles.primaryActionShadow} />
            <LinearGradient colors={["#2ECC71", "#00A86B", "#007A50"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryAction}>
              <Camera color="#FFFFFF" size={24} />
              <Text style={styles.primaryActionText}>Detect Another</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionWrap} onPress={() => { stopSpeaking(); router.push("/"); }} activeOpacity={0.9}>
            <View style={styles.secondaryActionShadow} />
            <LinearGradient colors={["#FFF", "#F0EBF8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.secondaryAction}>
               <Home color="#4A0099" size={24} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0EBF8" },
  radialGlow: { position: "absolute", top: -80, alignSelf: "center", left: "10%", width: 320, height: 320, borderRadius: 160, backgroundColor: "#8B00FF", opacity: 0.35 },

  headerOuter: { paddingBottom: 40, paddingHorizontal: 22, overflow: "visible", zIndex: 10, alignItems: "center" },
  headerNav: { width: "100%", flexDirection: "row", justifyContent: "flex-start", marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  titlePill: { backgroundColor: "#FFD93D", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  titlePillTxt: { fontSize: 22, fontWeight: "900", color: "#2D0060", letterSpacing: 0.5 },

  curveContainer: { height: 28, overflow: "visible", zIndex: 5 },
  curveBg: { position: "absolute", bottom: 0, left: -20, right: -20, height: 60, backgroundColor: "#F0EBF8", borderTopLeftRadius: 36, borderTopRightRadius: 36 },

  scroll: { flex: 1, backgroundColor: "#F0EBF8" },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60, flexGrow: 1 },

  objectCardWrap: { position: "relative", width: "100%", marginBottom: 24, zIndex: 5 },
  objectCardShadow: { position: "absolute", bottom: -8, left: 6, right: 6, height: "100%", borderRadius: 32, backgroundColor: "#4C1D95", opacity: 0.9 },
  objectCard: { borderRadius: 32, padding: 32, alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  dotPattern: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06, borderRadius: 32 },

  objectIconBlob: { position: "absolute", top: 20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.2)" },
  objectIcon: { fontSize: 56, marginBottom: 16 },
  objectName: { fontSize: 36, fontWeight: "900", color: "#FFFFFF", textAlign: "center", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  descriptionCardWrap: { position: "relative", width: "100%", marginBottom: 20 },
  descriptionShadow: { position: "absolute", bottom: -5, left: 4, right: 4, height: "100%", borderRadius: 24, backgroundColor: "rgba(0,0,0,0.15)" },
  descriptionCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, borderWidth: 2, borderColor: "rgba(139, 0, 255, 0.15)", alignItems: "center", gap: 16 },
  descIconBox: { backgroundColor: "#F0EBF8", width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  descIcon: { fontSize: 24 },
  descTexts: { flex: 1 },
  descriptionTitle: { fontSize: 18, fontWeight: "800", color: "#2D0060", marginBottom: 6 },
  descriptionText: { fontSize: 15, color: "#666", lineHeight: 22, fontWeight: "600" },

  audioButtonWrap: { position: "relative", width: "100%", marginBottom: 16 },
  audioButtonShadow: { position: "absolute", bottom: -6, left: 4, right: 4, height: "100%", borderRadius: 24, backgroundColor: "#B85E00" },
  audioButton: { flexDirection: "row", borderRadius: 24, paddingVertical: 18, justifyContent: "center", alignItems: "center", gap: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", overflow: "hidden" },
  audioButtonText: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.2)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  pointsBadge: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: "rgba(139, 0, 255, 0.08)", borderRadius: 20, paddingVertical: 12, paddingHorizontal: 20, alignSelf: "center", borderWidth: 2, borderColor: "#E0D0FF" },
  pointsEmoji: { fontSize: 24 },
  pointsText: { fontSize: 16, fontWeight: "800", color: "#4A0099" },

  bottomActions: { flexDirection: "row", gap: 16, paddingBottom: 40 },
  primaryActionWrap: { flex: 1, position: "relative" },
  primaryActionShadow: { position: "absolute", bottom: -6, left: 2, right: 2, height: "100%", borderRadius: 20, backgroundColor: "#005A38" },
  primaryAction: { flexDirection: "row", borderRadius: 20, paddingVertical: 18, justifyContent: "center", alignItems: "center", gap: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  primaryActionText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },

  secondaryActionWrap: { position: "relative", width: 64, height: 64 },
  secondaryActionShadow: { position: "absolute", bottom: -5, left: 2, right: 2, height: "100%", borderRadius: 20, backgroundColor: "rgba(0,0,0,0.15)" },
  secondaryAction: { flex: 1, borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(139, 0, 255, 0.2)" },
});
