import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { useRouter } from "expo-router";
import { SwitchCamera, Zap, ZapOff } from "lucide-react-native";
import { COLORS } from "../../constants/app";
import { api } from "../../services/api";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

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
        <Text style={styles.permText}>
          We need your camera to detect objects and help you learn!
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Allow Camera</Text>
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
        const result = await api.detectObject(photo.base64);
        router.push({
          pathname: "/result",
          params: {
            objectName: result.object_name,
            description: result.description,
            audioUrl: result.audio_url || "",
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
      {/* Camera as a flat layer — no children inside CameraView */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash ? "on" : "off"}
      />

      {/* All UI overlays on top using absolute positioning */}
      <View style={styles.overlay}>
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFlash(!flash)}
          >
            {flash ? (
              <Zap color="#FFD700" size={24} fill="#FFD700" />
            ) : (
              <ZapOff color="#FFFFFF" size={24} />
            )}
          </TouchableOpacity>

          <Text style={styles.cameraTitle}>Point at an object! 🎯</Text>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFacing(facing === "back" ? "front" : "back")}
          >
            <SwitchCamera color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        {/* Camera frame guide */}
        <View style={styles.frameGuide}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {isDetecting ? (
            <View style={styles.detectingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.detectingText}>🔍 Detecting...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              activeOpacity={0.7}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  permText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  permButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  permButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  frameGuide: {
    position: "absolute",
    top: "25%",
    left: "15%",
    right: "15%",
    bottom: "30%",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: COLORS.accent,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  bottomControls: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  detectingContainer: {
    alignItems: "center",
    gap: 12,
  },
  detectingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
