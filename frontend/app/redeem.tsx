import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, Stack } from "expo-router";
import { Star, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../services/api";
import ConfettiCannon from "react-native-confetti-cannon";

const REWARDS = [
  { id: 1, name: "Cosmic Avatar Pack", emoji: "🧑‍🚀", cost: 300, grad: ["#FFD93D", "#FFA500"], shadow: "#B85E00" },
  { id: 2, name: "Mystic Decoder", emoji: "🔮", cost: 150, grad: ["#A855F7", "#7C3AED"], shadow: "#4C1D95" },
  { id: 3, name: "Super Speed Buff", emoji: "⚡", cost: 200, grad: ["#FF6B6B", "#FF3E88"], shadow: "#9D003F" },
  { id: 4, name: "Pro Detective", emoji: "🕵️‍♂️", cost: 250, grad: ["#43E8D8", "#00BFFF"], shadow: "#005599" },
  { id: 5, name: "Mystery Treasure", emoji: "🎁", cost: 100, grad: ["#FFD93D", "#FF8C00"], shadow: "#CC5500" },
  { id: 6, name: "Golden Crown", emoji: "👑", cost: 500, grad: ["#2ECC71", "#00A86B"], shadow: "#005A38" },
];

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

function GlowBlob({ color, size, style, duration }: { color: string; size: number; style?: any; duration: number; }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] });
  return <Animated.View style={[{ width: size, height: size * 0.85, borderRadius: size / 2, backgroundColor: color, position: "absolute", opacity: 0.28, transform: [{ translateY }, { scale }] }, style]} />;
}

export default function RedeemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const confettiRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchStats = async () => {
        try {
          const data = await api.getUserStats(1);
          if (isActive) setPoints(data.total_points);
        } catch (error) {
          console.error("Failed to fetch points", error);
        }
      };
      fetchStats();
      return () => { isActive = false; };
    }, [])
  );

  const handleRedeem = async (item: typeof REWARDS[0]) => {
    if (loading) return;

    if (points < item.cost) {
      Alert.alert(
        "Need More Points! 🌟",
        `You need ${item.cost - points} more point${item.cost - points > 1 ? "s" : ""} to get the ${item.name}. Keep exploring!`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Confirm Purchase 🎁",
      `Do you want to spend ${item.cost} points on ${item.emoji} ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Get it!",
          onPress: async () => {
            try {
              setLoading(true);
              const res = await api.deductPoints(1, item.cost);
              setPoints(res.new_total);
              if (confettiRef.current) confettiRef.current.start();
            } catch (error) {
              Alert.alert("Error", "Could not complete purchase. Check internet connection.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={["#0D001F", "#220050", "#4A0099", "#7B1FD4"]} style={StyleSheet.absoluteFillObject} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <View style={styles.radialGlow} />

      {/* Header */}
      <View style={[styles.headerOuter, { paddingTop: insets.top + 20 }]}>
        <GlowBlob color="#FFD93D" size={120} style={{ top: -20, left: -40 }} duration={2800} />
        <GlowBlob color="#A855F7" size={150} style={{ top: 10, right: -50 }} duration={3200} />
        <FloatEmoji emoji="✨" size={16} style={{ top: 60, right: 80 }} duration={2000} floatRange={10} />
        <FloatEmoji emoji="🎁" size={24} style={{ top: 100, left: 30 }} duration={2500} floatRange={14} />

        <View style={styles.headerNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#FFF" size={26} />
          </TouchableOpacity>
          <View style={styles.pointsPill}>
            <Text style={styles.pointsPillTxt}>🌟 {points} Points</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Prize Shop</Text>
        <View style={styles.heroPill}>
          <Text style={styles.heroPillTxt}>Exchange your points! 🎒</Text>
        </View>
      </View>

      <View style={styles.curveContainer}>
        <View style={styles.curveBg} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {REWARDS.map((item) => {
            const isAffordable = points >= item.cost;
            return (
              <View key={item.id} style={styles.rewardWrapOuter}>
                <TouchableOpacity
                  style={styles.rewardWrap}
                  activeOpacity={0.8}
                  onPress={() => handleRedeem(item)}
                  disabled={loading}
                >
                  <View style={[styles.rewardShadow, { backgroundColor: isAffordable ? item.shadow : "#888" }]} />
                  <LinearGradient
                    colors={isAffordable ? (item.grad as [string, string]) : ["#B0BEC5", "#90A4AE"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.rewardCard}
                  >
                    <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
                    <View style={styles.dotPattern} />

                    <View style={styles.emojiWrap}>
                      <View style={styles.emojiBlob} />
                      <Text style={[styles.rewardEmoji, !isAffordable && { opacity: 0.5 }]}>{item.emoji}</Text>
                    </View>
                    <Text style={[styles.rewardName, !isAffordable && { color: "rgba(255,255,255,0.8)" }]}>{item.name}</Text>
                    
                    <View style={[styles.costBadge, isAffordable ? styles.affordable : styles.tooExpensive]}>
                      <Star color={isAffordable ? "#FFD700" : "#607D8B"} size={12} fill={isAffordable ? "#FFD700" : "transparent"} />
                      <Text style={[styles.costText, isAffordable ? { color: "#FFF" } : { color: "#FFF" }]}>{item.cost}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
             <View style={styles.spinnerBlob}>
               <ActivityIndicator size="large" color="#FFF" />
             </View>
             <Text style={styles.loadingText}>Redeeming...</Text>
          </View>
        )}
      </ScrollView>

      {/* Confetti Animation */}
      <ConfettiCannon ref={confettiRef} count={80} origin={{ x: -10, y: 0 }} autoStart={false} fadeOut={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0EBF8" },
  radialGlow: { position: "absolute", top: -80, alignSelf: "center", left: "10%", width: 320, height: 320, borderRadius: 160, backgroundColor: "#8B00FF", opacity: 0.35 },

  headerOuter: { paddingBottom: 40, paddingHorizontal: 22, overflow: "visible", zIndex: 10, alignItems: "center" },
  headerNav: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  
  pointsPill: { backgroundColor: "#FF8C00", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 2, borderColor: "#FFD93D", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  pointsPillTxt: { fontSize: 15, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5 },

  heroTitle: { fontSize: 36, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5, marginBottom: 8, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  heroPill: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  heroPillTxt: { fontSize: 14, fontWeight: "800", color: "#FFF" },

  curveContainer: { height: 28, overflow: "visible", zIndex: 5 },
  curveBg: { position: "absolute", bottom: 0, left: -20, right: -20, height: 60, backgroundColor: "#F0EBF8", borderTopLeftRadius: 36, borderTopRightRadius: 36 },

  scroll: { flex: 1, backgroundColor: "#F0EBF8" },
  scrollContent: { padding: 20, paddingBottom: 60 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 0 },

  rewardWrapOuter: { width: "48%", marginBottom: 20 },
  rewardWrap: { position: "relative", width: "100%" },
  rewardShadow: { position: "absolute", bottom: -6, left: 4, right: 4, height: "100%", borderRadius: 26, opacity: 0.9 },
  rewardCard: { borderRadius: 26, minHeight: 180, alignItems: "center", justifyContent: "center", padding: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  dotPattern: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06, borderRadius: 26 },

  emojiWrap: { position: "relative", alignItems: "center", justifyContent: "center", marginBottom: 12, width: 60, height: 60 },
  emojiBlob: { position: "absolute", width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.25)" },
  rewardEmoji: { fontSize: 40 },
  
  rewardName: { fontSize: 16, fontWeight: "900", color: "#FFF", marginBottom: 10, textAlign: "center", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  
  costBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, gap: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  affordable: { backgroundColor: "rgba(0,0,0,0.3)" },
  tooExpensive: { backgroundColor: "rgba(0,0,0,0.2)" },
  costText: { fontSize: 13, fontWeight: "900" },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(240,235,248,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: 24 },
  spinnerBlob: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#7B1FD4", alignItems: "center", justifyContent: "center", shadowColor: "#4A0099", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6, marginBottom: 16 },
  loadingText: { fontSize: 20, fontWeight: "800", color: "#4A0099" },
});
