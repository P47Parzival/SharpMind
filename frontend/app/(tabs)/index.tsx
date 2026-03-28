import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { COLORS } from "../../constants/app";
import { api } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Floating Emoji Particle ──────────────────────────────────────────────────
function FloatEmoji({
  style,
  duration,
  size,
  emoji,
  floatRange = 14,
}: {
  style?: any;
  duration: number;
  size: number;
  emoji: string;
  floatRange?: number;
}) {
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

  return (
    <Animated.Text
      style={[
        { position: "absolute", fontSize: size, transform: [{ translateY }, { rotate }, { scale }] },
        style,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─── Glowing Blob ─────────────────────────────────────────────────────────────
function GlowBlob({
  color,
  size,
  style,
  duration,
}: {
  color: string;
  size: number;
  style?: any;
  duration: number;
}) {
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

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size * 0.85,
          borderRadius: size / 2,
          backgroundColor: color,
          position: "absolute",
          opacity: 0.28,
          transform: [{ translateY }, { scale }],
        },
        style,
      ]}
    />
  );
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────
function StatBadge({
  emoji,
  value,
  label,
  bgColor,
  borderColor,
  delay,
}: {
  emoji: string;
  value: number;
  label: string;
  bgColor: string;
  borderColor: string;
  delay: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[statStyles.wrapper, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      {/* Bottom shadow for 3D lift */}
      <View style={[statStyles.shadowLayer, { backgroundColor: borderColor }]} />
      <View style={[statStyles.card, { backgroundColor: bgColor, borderColor }]}>
        {/* Top gloss */}
        <View style={statStyles.gloss} />
        <Text style={statStyles.emoji}>{emoji}</Text>
        <Text style={statStyles.value}>{value}</Text>
        <Text style={statStyles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({
  emoji,
  title,
  gradientColors,
  shadowColor,
  onPress,
  delay,
  isSpecial,
  badge,
}: {
  emoji: string;
  title: string;
  gradientColors: string[];
  shadowColor: string;
  onPress: () => void;
  delay: number;
  isSpecial?: boolean;
  badge?: string;
}) {
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, tension: 100, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [delay]);

  // Wobble on mount after initial entry
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0.5, duration: 100, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }, delay + 600);
    return () => clearTimeout(timer);
  }, []);

  const rotate = wobble.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-4deg", "0deg", "4deg"] });

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.93, tension: 300, friction: 10, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={[
        gridStyles.wrapper,
        isSpecial ? gridStyles.fullWidth : gridStyles.halfWidth,
        {
          transform: [{ scale: Animated.multiply(scaleAnim, pressAnim) }, { rotate }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Chunky outer shadow layer for "toy" depth */}
        <View style={[gridStyles.shadowLayer, { backgroundColor: shadowColor }]} />

        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gridStyles.card}
        >
          {/* Top gloss shine */}
          <LinearGradient
            colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={gridStyles.gloss}
          />

          {/* Dot pattern texture */}
          <View style={gridStyles.dotPattern} />

          {badge && (
            <View style={gridStyles.badgeWrap}>
              <LinearGradient colors={["#FF3CAC", "#784BA0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={gridStyles.badge}>
                <Text style={gridStyles.badgeTxt}>⚡ {badge}</Text>
              </LinearGradient>
            </View>
          )}

          <View style={gridStyles.emojiWrap}>
            {/* Soft glow blob behind emoji */}
            <View style={[gridStyles.emojiBlob, { backgroundColor: "rgba(255,255,255,0.25)" }]} />
            <Text style={gridStyles.emoji}>{emoji}</Text>
          </View>

          <Text style={gridStyles.title}>{title}</Text>

          {/* Bottom tag strip */}
          <View style={gridStyles.tapTag}>
            <Text style={gridStyles.tapTxt}>TAP! 👆</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const headerAnim = useRef(new Animated.Value(-80)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const bannerBounce = useRef(new Animated.Value(0)).current;

  const [stats, setStats] = useState({
    totalPoints: 0,
    streakCount: 0,
    objectsDetected: 0,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]).start();

    // Continuous gentle banner bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bannerBounce, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(bannerBounce, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchStats = async () => {
        try {
          const data = await api.getUserStats(1);
          if (isActive) {
            setStats({
              totalPoints: data.total_points,
              streakCount: data.streak_count,
              objectsDetected: data.objects_detected,
            });
          }
        } catch (error) {
          console.error("Failed to fetch user stats on home screen", error);
        }
      };
      fetchStats();
      return () => { isActive = false; };
    }, [])
  );

  const bannerTranslateY = bannerBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Deep space gradient background ── */}
      <LinearGradient
        colors={["#0D001F", "#220050", "#4A0099", "#7B1FD4"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* ── Subtle radial glow at center-top ── */}
      <View style={styles.radialGlow} />

      {/* ── Header ── */}
      <View style={styles.headerOuter}>
        {/* Background blobs */}
        <GlowBlob color="#FF4DB8" size={180} style={{ top: -50, right: -50 }} duration={3000} />
        <GlowBlob color="#FFD93D" size={100} style={{ top: 40, left: -20 }} duration={2600} />
        <GlowBlob color="#3DDDFF" size={80} style={{ bottom: 0, right: 60 }} duration={2200} />
        <GlowBlob color="#A855F7" size={130} style={{ bottom: -30, left: 80 }} duration={3400} />

        {/* Floating emoji confetti */}
        <FloatEmoji emoji="⭐" size={22} style={{ top: 70, left: 18 }} duration={2000} floatRange={12} />
        <FloatEmoji emoji="🌙" size={16} style={{ top: 120, right: 24 }} duration={2600} floatRange={16} />
        <FloatEmoji emoji="✨" size={14} style={{ top: 55, right: 75 }} duration={1800} floatRange={10} />
        <FloatEmoji emoji="🌈" size={18} style={{ top: 160, left: 55 }} duration={3000} floatRange={14} />
        <FloatEmoji emoji="💫" size={13} style={{ top: 90, right: 130 }} duration={2300} floatRange={8} />

        <Animated.View style={{ transform: [{ translateY: headerAnim }], opacity: headerOpacity }}>

          {/* ── Greeting Row ── */}
          <View style={styles.greetingRow}>
            {/* Left: greeting text */}
            <View style={styles.greetingTextBlock}>
              <View style={styles.heyPill}>
                <Text style={styles.heyPillTxt}>👋 Hello, Explorer!</Text>
              </View>
              <Text style={styles.greeting}>Ready to{"\n"}
                <Text style={styles.greetingAccent}>Have Fun? 🎉</Text>
              </Text>
            </View>

            {/* Right: Avatar with orbiting ring */}
            <Animated.View style={[styles.avatarOuter, { transform: [{ translateY: bannerTranslateY }] }]}>
              {/* Orbiting dot ring */}
              <View style={styles.orbitRing1} />
              <View style={styles.orbitRing2} />
              <LinearGradient
                colors={["#FFE040", "#FF8C00", "#FF4500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGrad}
              >
                <Text style={{ fontSize: 32 }}>🧒</Text>
              </LinearGradient>
              {/* Level badge */}
              <View style={styles.levelBadge}>
                <Text style={styles.levelTxt}>Lv 1</Text>
              </View>
            </Animated.View>
          </View>

        </Animated.View>
      </View>

      {/* ── Curved divider ── */}
      <View style={styles.curveContainer}>
        <View style={styles.curveBg} />
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stat Badges (scrolls with content) ── */}
        <View style={styles.statsRowScroll}>
          <StatBadge
            emoji="⭐"
            value={stats.totalPoints}
            label="Points"
            bgColor="#FF8C00"
            borderColor="#CC5500"
            delay={80}
          />
          <StatBadge
            emoji="🔥"
            value={stats.streakCount}
            label="Streak"
            bgColor="#E5007F"
            borderColor="#A30060"
            delay={160}
          />
          <StatBadge
            emoji="🔍"
            value={stats.objectsDetected}
            label="Scanned"
            bgColor="#009DAA"
            borderColor="#007080"
            delay={240}
          />
        </View>

        {/* Section title */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>🎮 Pick Your Adventure</Text>
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillTxt}>7 Games</Text>
          </View>
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          <GridCard
            emoji="📷"
            title="Magic Camera"
            gradientColors={["#A855F7", "#7C3AED", "#5B21B6"]}
            shadowColor="#4C1D95"
            onPress={() => router.push("/(tabs)/camera")}
            delay={80}
          />
          <GridCard
            emoji="🎯"
            title="Treasure Hunt"
            gradientColors={["#FF6B6B", "#FF3E88", "#C2006F"]}
            shadowColor="#9D003F"
            onPress={() => router.push("/finder")}
            delay={140}
          />
          <GridCard
            emoji="🏝️"
            title="Night Island"
            gradientColors={["#00D4FF", "#0094FF", "#0053C8"]}
            shadowColor="#0035A0"
            onPress={() => router.push("/lingo-island" as any)}
            badge="NEW 3D"
            delay={200}
            isSpecial
          />
          <GridCard
            emoji="🗣️"
            title="Speak Words"
            gradientColors={["#FFD93D", "#FFA500", "#E07B00"]}
            shadowColor="#B85E00"
            onPress={() => router.push("/vocab_levels")}
            delay={260}
          />
          <GridCard
            emoji="🏆"
            title="Trophy Room"
            gradientColors={["#2ECC71", "#00A86B", "#007A50"]}
            shadowColor="#005A38"
            onPress={() => router.push("/(tabs)/profile")}
            delay={320}
          />
          <GridCard
            emoji="🎁"
            title="Prize Shop"
            gradientColors={["#FF66CC", "#CC00FF", "#8800BB"]}
            shadowColor="#660099"
            onPress={() => router.push("/redeem")}
            delay={380}
          />
          <GridCard
            emoji="🥽"
            title="3D Magic"
            gradientColors={["#43E8D8", "#00BFFF", "#0077CC"]}
            shadowColor="#005599"
            onPress={() => router.push("/ar-models")}
            delay={440}
          />
        </View>

        {/* ── Daily Tip Banner ── */}
        <LinearGradient
          colors={["#FFF8C5", "#FFF0A0", "#FFDF60"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tipStyles.card}
        >
          {/* Decorative left stripe */}
          <View style={tipStyles.leftStripe} />

          <View style={tipStyles.inner}>
            <View style={tipStyles.topRow}>
              <View style={tipStyles.bulbCircle}>
                <Text style={{ fontSize: 22 }}>💡</Text>
              </View>
              <View>
                <Text style={tipStyles.eyebrow}>TIP OF THE DAY</Text>
                <Text style={tipStyles.title}>Did you know?</Text>
              </View>
            </View>
            <Text style={tipStyles.text}>
              Learning new words every day helps your brain grow stronger! Try
              scanning 5 objects today to earn bonus points! 🎉
            </Text>
            <View style={tipStyles.sparkleRow}>
              {["⭐", "🌈", "🚀", "✨", "🎯"].map((s, i) => (
                <Text key={i} style={tipStyles.sparkle}>{s}</Text>
              ))}
            </View>
          </View>
        </LinearGradient>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Soft radial glow at top center
  radialGlow: {
    position: "absolute",
    top: -80,
    alignSelf: "center",
    left: "10%",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#8B00FF",
    opacity: 0.35,
  },

  headerOuter: {
    paddingTop: 58,
    paddingBottom: 28,
    paddingHorizontal: 22,
    overflow: "hidden",
    zIndex: 10,
  },

  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  greetingTextBlock: { flex: 1, paddingRight: 12 },

  heyPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  heyPillTxt: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  greeting: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  greetingAccent: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFD93D",
    letterSpacing: -0.5,
    textShadowColor: "rgba(255, 217, 61, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  avatarOuter: { position: "relative", width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  orbitRing1: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "rgba(255, 220, 61, 0.45)",
    borderStyle: "dashed",
  },
  orbitRing2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  avatarGrad: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.75)",
  },
  levelBadge: {
    position: "absolute",
    bottom: -2,
    right: -6,
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  levelTxt: { fontSize: 10, fontWeight: "900", color: "#FFF" },

  statsRowScroll: { flexDirection: "row", gap: 10, marginBottom: 18 },

  curveContainer: { height: 28, overflow: "visible", zIndex: 5 },
  curveBg: {
    position: "absolute",
    bottom: 0,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: "#F0EBF8",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },

  scroll: { flex: 1, backgroundColor: "#F0EBF8" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10 },

  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#2D0060", letterSpacing: -0.3 },
  sectionPill: {
    backgroundColor: "#E0D0FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sectionPillTxt: { fontSize: 12, fontWeight: "800", color: "#6B00CC" },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 0,
  },
});

const statStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
  // The "pressed down" shadow layer offset below the card
  shadowLayer: {
    position: "absolute",
    bottom: -5,
    left: 4,
    right: 4,
    height: "100%",
    borderRadius: 20,
    opacity: 0.85,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 2,
    overflow: "hidden",
    borderWidth: 2.5,
    // Shadow on iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  // Top half gloss shine
  gloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  emoji: { fontSize: 22, marginBottom: 2 },
  value: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  label: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

const gridStyles = StyleSheet.create({
  wrapper: { marginBottom: 14, position: "relative" },
  halfWidth: { width: "48%" },
  fullWidth: { width: "100%" },

  // Offset "thick bottom shadow" layer — gives physical toy card depth
  shadowLayer: {
    position: "absolute",
    bottom: -5,
    left: 5,
    right: 5,
    height: "100%",
    borderRadius: 28,
    opacity: 0.7,
  },

  card: {
    borderRadius: 28,
    minHeight: 170,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderBottomColor: "rgba(0,0,0,0.1)",
    // Shadow for floating feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },

  gloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },

  // Subtle dot pattern texture
  dotPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
    // Achieved via border trick for pattern feel
    borderRadius: 28,
  },

  badgeWrap: { position: "absolute", top: 12, right: 10, zIndex: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  badgeTxt: { color: "#FFF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },

  emojiWrap: { alignItems: "center", justifyContent: "center", marginBottom: 10, position: "relative" },
  emojiBlob: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  emoji: {
    fontSize: 58,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 10,
    zIndex: 2,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    zIndex: 2,
  },

  tapTag: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  tapTxt: {
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

const tipStyles = StyleSheet.create({
  card: {
    borderRadius: 26,
    marginTop: 6,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFB300",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  leftStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: "#FFB300",
  },
  inner: {
    padding: 20,
    paddingLeft: 22,
  },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  bulbCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFD93D",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFB300",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: "#B45309",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#92400E",
    letterSpacing: -0.2,
  },
  text: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 21,
    fontWeight: "600",
  },
  sparkleRow: { flexDirection: "row", marginTop: 14, gap: 4 },
  sparkle: { fontSize: 18 },
});