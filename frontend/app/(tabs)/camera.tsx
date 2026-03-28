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
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { useRouter } from "expo-router";
import { SwitchCamera, Zap, ZapOff } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/app";
import { api } from "../../services/api";

const LANGUAGES = [
  { name: "English", code: "en-US", emoji: "🇬🇧" },
  { name: "Spanish", code: "es-ES", emoji: "🇪🇸" },
  { name: "German", code: "de-DE", emoji: "🇩🇪" },
  { name: "Hindi", code: "hi-IN", emoji: "🇮🇳" },
];

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isDetecting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isDetecting]);

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
        <Text style={styles.permText}>
          We need your camera to detect objects and help you learn new words!
        </Text>
        <TouchableOpacity style={styles.permButtonWrap} onPress={requestPermission} activeOpacity={0.8}>
           <View style={styles.permButtonShadow} />
           <LinearGradient colors={["#A855F7", "#7C3AED"]} style={styles.permButton}>
             <Text style={styles.permButtonText}>Allow Camera</Text>
           </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isDetecting) return;

    setIsDetecting(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (photo?.base64) {
        const result = await api.detectObject(photo.base64, selectedLang.name);
        router.push({
          pathname: "/result",
          params: {
            objectName: result.object_name,
            description: result.description,
            audioUrl: result.audio_url || "",
            languageCode: selectedLang.code,
          },
        });
      }
    } catch (error) {
      console.error("Detection error:", error);
      Alert.alert(
        "Oops!",
        "Something went wrong. Make sure the backend server is running and try again!",
        [{ text: "OK" }]
      );
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash ? "on" : "off"}
      />

      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.iconButtonWrap}
            onPress={() => setFlash(!flash)}
            activeOpacity={0.7}
          >
            <View style={styles.iconButtonShadow} />
            <View style={styles.iconButton}>
              {flash ? <Zap color="#FFD93D" size={24} fill="#FFD93D" /> : <ZapOff color="#FFFFFF" size={24} />}
            </View>
          </TouchableOpacity>

          <View style={styles.cameraTitlePill}>
            <Text style={styles.cameraTitleTxt}>Point at an object! 🎯</Text>
          </View>

          <TouchableOpacity
            style={styles.iconButtonWrap}
            onPress={() => setFacing(facing === "back" ? "front" : "back")}
            activeOpacity={0.7}
          >
            <View style={styles.iconButtonShadow} />
            <View style={styles.iconButton}>
              <SwitchCamera color="#FFFFFF" size={24} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Language Selector */}
        <View style={styles.languageContainer}>
          {LANGUAGES.map((lang) => (
             <TouchableOpacity
             key={lang.code}
             style={[
               styles.langBadgeWrap,
               selectedLang.code === lang.code && { transform: [{ scale: 1.1 }] }
             ]}
             onPress={() => setSelectedLang(lang)}
             activeOpacity={0.8}
           >
             {selectedLang.code === lang.code && <View style={styles.langBadgeShadow} />}
             <View style={[styles.langBadge, selectedLang.code === lang.code && styles.langBadgeActive]}>
                <Text style={styles.langEmoji}>{lang.emoji}</Text>
             </View>
           </TouchableOpacity>
         ))}
        </View>

        {/* Camera Frame Guide */}
        <Animated.View style={[styles.frameGuide, isDetecting && { transform: [{ scale: pulseAnim }], borderColor: "#FFD93D" }]}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </Animated.View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {isDetecting ? (
            <View style={styles.detectingBox}>
               <ActivityIndicator size="large" color="#FFD93D" />
               <Text style={styles.detectingText}>Scanning... 🔍</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.captureWrap}
              onPress={handleCapture}
              activeOpacity={0.9}
            >
              <View style={styles.captureShadow} />
              <View style={styles.captureOuter}>
                 <View style={styles.captureInner} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D001F", padding: 32 },
  permEmoji: { fontSize: 64, marginBottom: 16 },
  permTitle: { fontSize: 28, fontWeight: "900", color: "#FFFFFF", marginBottom: 12, textAlign: "center" },
  permText: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 32, lineHeight: 24, fontWeight: "600" },
  permButtonWrap: { position: "relative", width: "80%" },
  permButtonShadow: { position: "absolute", bottom: -6, left: 2, right: 2, height: "100%", backgroundColor: "#4C1D95", borderRadius: 24 },
  permButton: { paddingVertical: 18, borderRadius: 24, alignItems: "center", borderWidth: 2, borderColor: "#A855F7" },
  permButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },

  topControls: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  iconButtonWrap: { position: "relative", width: 44, height: 44 },
  iconButtonShadow: { position: "absolute", bottom: -3, left: 1, right: 1, height: "100%", borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)" },
  iconButton: { flex: 1, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  
  cameraTitlePill: { backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  cameraTitleTxt: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 },

  frameGuide: { position: "absolute", top: "25%", left: "15%", right: "15%", bottom: "30%" },
  corner: { position: "absolute", width: 40, height: 40, borderColor: "#FFFFFF", borderWidth: 4, borderRadius: 12 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  bottomControls: { position: "absolute", bottom: 60, left: 0, right: 0, alignItems: "center" },
  captureWrap: { position: "relative", width: 84, height: 84 },
  captureShadow: { position: "absolute", bottom: -6, left: 2, right: 2, height: "100%", borderRadius: 42, backgroundColor: "rgba(0,0,0,0.5)" },
  captureOuter: { flex: 1, borderRadius: 42, backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: "#FFFFFF" },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFFFFF" },

  detectingBox: { backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 24, paddingVertical: 16, borderRadius: 24, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  detectingText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", letterSpacing: 1 },

  languageContainer: { flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 24, zIndex: 10 },
  langBadgeWrap: { position: "relative" },
  langBadgeShadow: { position: "absolute", bottom: -4, left: 2, right: 2, height: "100%", borderRadius: 24, backgroundColor: "#C2006F" },
  langBadge: { backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 24, borderWidth: 2, borderColor: "transparent" },
  langBadgeActive: { backgroundColor: "#FFD93D", borderColor: "#FFFFFF" },
  langEmoji: { fontSize: 26 },
});
