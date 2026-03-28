import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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

// ─── Stat Card (3D Toy Style) ────────────────────────────────────────────────
function StatCard({
  emoji,
  value,
  label,
  gradientColors,
  shadowColor,
  delay,
}: {
  emoji: string;
  value: number | string;
  label: string;
  gradientColors: string[];
  shadowColor: string;
  delay: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, scaleAnim, opacityAnim]);

  return (
    <Animated.View style={[statStyles.wrapper, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <View style={[statStyles.shadowLayer, { backgroundColor: shadowColor }]} />
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={statStyles.card}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={statStyles.gloss}
        />
        <View style={statStyles.dotPattern} />

        <View style={statStyles.emojiWrap}>
          <View style={[statStyles.emojiBlob, { backgroundColor: "rgba(255,255,255,0.25)" }]} />
          <Text style={statStyles.emoji}>{emoji}</Text>
        </View>

        <Text style={statStyles.value}>{value}</Text>
        <Text style={statStyles.label}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Achievement Card ───────────────────────────────────────────────────────
function AchievementCard({
  emoji,
  title,
  desc,
  unlocked,
  delay,
}: {
  emoji: string;
  title: string;
  desc: string;
  unlocked: boolean;
  delay: number;
}) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, delay, tension: 150, friction: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, slideAnim, opacityAnim]);

  return (
    <Animated.View style={[achieveStyles.wrapper, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <View style={[achieveStyles.shadowLayer, { backgroundColor: unlocked ? "#00A86B" : "#B0B0B0" }]} />
      <View style={[achieveStyles.card, !unlocked && achieveStyles.cardLocked]}>
        <Text style={achieveStyles.emoji}>{emoji}</Text>
        <View style={achieveStyles.info}>
          <Text style={achieveStyles.title}>{title}</Text>
          <Text style={achieveStyles.desc}>{desc}</Text>
        </View>
        <View style={[achieveStyles.badge, unlocked ? achieveStyles.badgeUnlocked : achieveStyles.badgeLocked]}>
          <Text style={achieveStyles.badgeTxt}>{unlocked ? "✓" : "🔒"}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Certificate Card ───────────────────────────────────────────────────────
function CertificateCard({ unlocked, progress, displayName }: { unlocked: boolean; progress: number; displayName: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleGenerate = async () => {
    if (!unlocked) return;
    setIsGenerating(true);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    try {
      const certId = "CERT-" + Math.random().toString(36).substr(2, 8).toUpperCase();
      const html = `
        <html>
          <head>
            <style>
              @page { margin: 0; size: landscape; }
              * { box-sizing: border-box; }
              html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
              body { font-family: 'Georgia', serif; padding: 30px; background-color: #f9f9f9; text-align: center; display: flex; justify-content: center; align-items: center; }
              .border { border: 15px solid #d4af37; padding: 20px; background-color: #fff; position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; }
              .inner-border { border: 2px solid #d4af37; padding: 20px; height: 100%; position: relative; display: flex; flex-direction: column; justify-content: center; }
              .title { font-size: 50px; color: #333; margin-bottom: 15px; font-weight: bold; letter-spacing: 2px; }
              .subtitle { font-size: 24px; color: #666; margin-bottom: 25px; }
              .name { font-size: 60px; color: #d4af37; margin-bottom: 25px; font-family: 'Brush Script MT', cursive; font-style: italic; }
              .reason { font-size: 22px; color: #444; margin-bottom: 40px; line-height: 1.8; padding: 0 80px; }
              .signatures { display: flex; justify-content: space-between; padding: 0 40px; margin-top: auto; align-items: flex-end; }
              .sig-block { text-align: center; }
              .sig { font-family: 'Brush Script MT', cursive; font-size: 26px; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; width: 180px; color: #222; }
              .sig-title { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
              .seal { position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); width: 80px; height: 80px; background-color: #d4af37; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 40px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px dashed #fff; }
              .cert-id { position: absolute; bottom: 10px; right: 15px; font-size: 12px; color: #aaa; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="border">
              <div class="inner-border">
                <div class="title">CERTIFICATE OF EXCELLENCE</div>
                <div class="subtitle">This certificate is proudly presented to</div>
                <div class="name">Siddhant</div>
                <div class="reason">
                  For outstanding achievement, unmatched dedication, and successful completion<br>
                  of the interactive learning journey. This scholar has demonstrated brilliant<br>
                  curiosity, mastered new vocabulary, and explored the world through our<br>
                  advanced magical lens with great enthusiasm.
                </div>
                
                <div class="signatures">
                  <div class="sig-block">
                    <div class="sig">Prof. Lexicon</div>
                    <div class="sig-title">Chief Explorer</div>
                  </div>
                  <div class="sig-block">
                    <div class="sig">Dr. Phonetics</div>
                    <div class="sig-title">Master of Learning</div>
                  </div>
                </div>
                
                <div class="seal">⭐⭐⭐</div>
                <div class="cert-id">ID: ${certId}</div>
              </div>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.warn("Could not generate certificate", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Animated.View style={[certStyles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[certStyles.shadowLayer, { backgroundColor: unlocked ? "#B85E00" : "#4C1D95" }]} />
      <LinearGradient
        colors={unlocked ? ["#FFD93D", "#FFA500", "#FF8C00"] as any : ["#A855F7", "#7C3AED", "#5B21B6"] as any}
        style={certStyles.card}
      >
        <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={certStyles.gloss} />
        <View style={certStyles.dotPattern} />

        {unlocked ? (
          <TouchableOpacity activeOpacity={0.8} onPress={handleGenerate} style={certStyles.content}>
            <Text style={certStyles.emoji}>🎓</Text>
            <Text style={certStyles.title}>Course Completed!</Text>
            <Text style={certStyles.desc}>You've mastered the basics.</Text>
            <View style={certStyles.btn}>
              <Text style={certStyles.btnTxt}>{isGenerating ? "Generating..." : "Download Certificate"}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={certStyles.content}>
            <Text style={certStyles.emoji}>📜</Text>
            <Text style={certStyles.title}>Certificate Locked</Text>
            <Text style={certStyles.desc}>Detect 1 object to unlock.</Text>
            <View style={certStyles.progressBg}>
              <View style={[certStyles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={certStyles.progressTxt}>{progress}% Completed</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    displayName: "Explorer",
    totalPoints: 0,
    streakCount: 0,
    objectsDetected: 0,
    challengesCompleted: 0,
  });

  const headerAnim = useRef(new Animated.Value(-80)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const bannerBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
    ]).start();

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
              displayName: data.display_name,
              totalPoints: data.total_points,
              streakCount: data.streak_count,
              objectsDetected: data.objects_detected,
              challengesCompleted: data.challenges_completed,
            });
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to fetch user stats", error);
          if (isActive) setLoading(false);
        }
      };

      fetchStats();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const bannerTranslateY = bannerBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const totalActivities = stats.objectsDetected; // Changed to only look at object detection
  const certificateGoal = 1;
  const progressPercent = Math.min(100, Math.floor((totalActivities / certificateGoal) * 100));
  const isCertificateUnlocked = totalActivities >= certificateGoal;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deep space gradient background */}
      <LinearGradient
        colors={["#0D001F", "#220050", "#4A0099", "#7B1FD4"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={styles.radialGlow} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerOuter}>
        <GlowBlob color="#FF4DB8" size={180} style={{ top: -50, right: -50 }} duration={3000} />
        <GlowBlob color="#FFD93D" size={100} style={{ top: 40, left: -20 }} duration={2600} />
        <GlowBlob color="#3DDDFF" size={80} style={{ bottom: -20, right: 60 }} duration={2200} />

        <FloatEmoji emoji="⭐" size={22} style={{ top: 70, left: 18 }} duration={2000} floatRange={12} />
        <FloatEmoji emoji="🏆" size={16} style={{ top: 120, right: 24 }} duration={2600} floatRange={16} />
        <FloatEmoji emoji="✨" size={14} style={{ top: 55, right: 75 }} duration={1800} floatRange={10} />

        <Animated.View style={[{ alignItems: "center", transform: [{ translateY: headerAnim }], opacity: headerOpacity }]}>
          <Animated.View style={[styles.avatarOuter, { transform: [{ translateY: bannerTranslateY }] }]}>
            <View style={styles.orbitRing1} />
            <View style={styles.orbitRing2} />
            <LinearGradient
              colors={["#FFE040", "#FF8C00", "#FF4500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGrad}
            >
              <Text style={{ fontSize: 40 }}>🧒</Text>
            </LinearGradient>
            <View style={styles.levelBadge}>
              <Text style={styles.levelTxt}>Lv 1</Text>
            </View>
          </Animated.View>

          <Text style={styles.displayName}>{stats.displayName}</Text>

          <View style={styles.pointsPill}>
            <Text style={styles.pointsPillTxt}>🌟 {stats.totalPoints} Total Points</Text>
          </View>
        </Animated.View>
      </View>

      {/* Curved divider */}
      <View style={styles.curveContainer}>
        <View style={styles.curveBg} />
      </View>

      <View style={[styles.scroll, styles.scrollContent]}>
        {loading ? (
          <ActivityIndicator size="large" color="#7B1FD4" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>📊 Your Stats</Text>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillTxt}>Awesome!</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                emoji="📖"
                value={stats.objectsDetected}
                label="Objects Learned"
                gradientColors={["#A855F7", "#7C3AED", "#5B21B6"]}
                shadowColor="#4C1D95"
                delay={50}
              />
              <StatCard
                emoji="🎯"
                value={stats.challengesCompleted}
                label="Challenges Won"
                gradientColors={["#FF6B6B", "#FF3E88", "#C2006F"]}
                shadowColor="#9D003F"
                delay={100}
              />
              <StatCard
                emoji="🔥"
                value={stats.streakCount}
                label="Day Streak"
                gradientColors={["#FFD93D", "#FFA500", "#E07B00"]}
                shadowColor="#B85E00"
                delay={150}
              />
              <StatCard
                emoji="🏆"
                value={stats.totalPoints}
                label="Total Points"
                gradientColors={["#2ECC71", "#00A86B", "#007A50"]}
                shadowColor="#005A38"
                delay={200}
              />
            </View>

            {/* Certificate Section */}
            <View style={[styles.sectionRow, { marginTop: 10 }]}>
              <Text style={styles.sectionTitle}>🎓 Certificate</Text>
              <View style={[styles.sectionPill, { backgroundColor: "#FFE040" }]}>
                <Text style={[styles.sectionPillTxt, { color: "#B85E00" }]}>Goal: 1</Text>
              </View>
            </View>

            <CertificateCard
              unlocked={isCertificateUnlocked}
              progress={progressPercent}
              displayName={stats.displayName}
            />

            <View style={[styles.sectionRow, { marginTop: 10 }]}>
              <Text style={styles.sectionTitle}>🏅 Achievements</Text>
              <View style={[styles.sectionPill, { backgroundColor: "#FFE5F1" }]}>
                <Text style={[styles.sectionPillTxt, { color: "#D80073" }]}>3 Badges</Text>
              </View>
            </View>

            <View style={styles.achievementsList}>
              <AchievementCard
                emoji="🌟"
                title="First Discovery"
                desc={stats.objectsDetected > 0 ? "You detected your first object!" : "Detect your first object to unlock this!"}
                unlocked={stats.objectsDetected > 0}
                delay={300}
              />
              <AchievementCard
                emoji="🔥"
                title="3-Day Streak"
                desc={stats.streakCount >= 3 ? "You used the app 3 days in a row!" : "Use the app 3 days in a row!"}
                unlocked={stats.streakCount >= 3}
                delay={400}
              />
              <AchievementCard
                emoji="🏆"
                title="Object Hunter"
                desc={stats.challengesCompleted >= 10 ? "You completed 10 finder challenges!" : "Complete 10 finder challenges!"}
                unlocked={stats.challengesCompleted >= 10}
                delay={500}
              />
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </View>
      {/* Deep bounce extension area */}
      <View style={{ position: "absolute", bottom: -800, left: 0, right: 0, height: 800, backgroundColor: "#F0EBF8" }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

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
    paddingTop: 68,
    paddingBottom: 48,
    paddingHorizontal: 22,
    overflow: "hidden",
    zIndex: 10,
    alignItems: "center",
  },

  avatarOuter: { position: "relative", width: 90, height: 90, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  orbitRing1: {
    position: "absolute",
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 2,
    borderColor: "rgba(255, 220, 61, 0.45)",
    borderStyle: "dashed",
  },
  orbitRing2: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  avatarGrad: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.75)",
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  levelTxt: { fontSize: 12, fontWeight: "900", color: "#FFF" },

  displayName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  pointsPill: {
    backgroundColor: "#FF8C00",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFD93D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  pointsPillTxt: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

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

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  achievementsList: {
    gap: 14,
  },
});

const statStyles = StyleSheet.create({
  wrapper: { width: "48%", marginBottom: 14, position: "relative" },
  shadowLayer: {
    position: "absolute",
    bottom: -5,
    left: 4,
    right: 4,
    height: "100%",
    borderRadius: 24,
    opacity: 0.8,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
  },
  gloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  dotPattern: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.06,
    borderRadius: 24,
  },
  emojiWrap: { alignItems: "center", justifyContent: "center", marginBottom: 6, position: "relative" },
  emojiBlob: {
    position: "absolute",
    width: 40, height: 40,
    borderRadius: 20,
  },
  emoji: { fontSize: 28 },
  value: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  label: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: "center",
  },
});

const achieveStyles = StyleSheet.create({
  wrapper: { position: "relative" },
  shadowLayer: {
    position: "absolute",
    bottom: -4,
    left: 2,
    right: 2,
    height: "100%",
    borderRadius: 20,
    opacity: 0.9,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  cardLocked: {
    backgroundColor: "#F5F5F5",
    borderColor: "#D0D0D0",
  },
  emoji: { fontSize: 32, marginRight: 14 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: "900", color: "#2D0060", marginBottom: 2 },
  desc: { fontSize: 12, color: "#666", fontWeight: "600", lineHeight: 16 },
  badge: {
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  badgeUnlocked: {
    backgroundColor: "#E8FFF6",
    borderColor: "#00A86B",
  },
  badgeLocked: {
    backgroundColor: "#E0E0E0",
    borderColor: "#B0B0B0",
  },
  badgeTxt: { fontSize: 16, fontWeight: "900", color: "#333" },
});

const certStyles = StyleSheet.create({
  wrapper: { width: "100%", marginBottom: 20, position: "relative" },
  shadowLayer: { position: "absolute", bottom: -6, left: 4, right: 4, height: "100%", borderRadius: 28, opacity: 0.9 },
  card: { borderRadius: 28, padding: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  dotPattern: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, backgroundColor: "transparent" },
  content: { alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "900", color: "#FFF", marginBottom: 4, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  desc: { fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "600", marginBottom: 16 },
  btn: { backgroundColor: "#FFF", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  btnTxt: { color: "#FF8C00", fontSize: 16, fontWeight: "900" },
  progressBg: { width: "100%", height: 16, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8, overflow: "hidden", marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  progressFill: { height: "100%", backgroundColor: "#FFD93D", borderRadius: 8 },
  progressTxt: { color: "#FFF", fontSize: 13, fontWeight: "800" },
});
