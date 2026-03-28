import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Star, Trophy } from 'lucide-react-native';

const LEVELS = [
  {
    id: '1',
    title: 'Level 1: Easy Peasy',
    desc: 'Perfect for starters! Simple words like Apple, Cat, and Sun.',
    icon: '🟢',
    gradient: ['#A855F7', '#7C3AED', '#5B21B6'] as const,
    shadowColor: '#4C1D95',
    wordCount: 10
  },
  {
    id: '2',
    title: 'Level 2: Tricky Words',
    desc: 'Intermediate phonetics! Words like Yellow, Turtle, and Breakfast.',
    icon: '🟡',
    gradient: ['#FF6B6B', '#FF3E88', '#C2006F'] as const,
    shadowColor: '#9D003F',
    wordCount: 15
  },
  {
    id: '3',
    title: 'Level 3: Brain Bender',
    desc: 'The ultimate challenge! Words like Mississippi and Encyclopedia.',
    icon: '🔴',
    gradient: ['#FFD93D', '#FFA500', '#E07B00'] as const,
    shadowColor: '#B85E00',
    wordCount: 12
  }
];

// ─── Floating Emoji Particle ──────────────────────────────────────────────────
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

// ─── Glowing Blob ─────────────────────────────────────────────────────────────
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

// ─── Toy Level Card ───────────────────────────────────────────────────────
function ToyLevelCard({ lvl, onPress, delay }: { lvl: typeof LEVELS[0]; onPress: () => void; delay: number }) {
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, tension: 100, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => Animated.spring(pressAnim, { toValue: 0.95, tension: 300, friction: 10, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(pressAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }).start();

  return (
    <Animated.View style={[cardStyles.wrapper, { transform: [{ scale: Animated.multiply(scaleAnim, pressAnim) }], opacity: opacityAnim }]}>
      <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={[cardStyles.shadowLayer, { backgroundColor: lvl.shadowColor }]} />
        <LinearGradient colors={lvl.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cardStyles.card}>
          <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={cardStyles.gloss} />
          <View style={cardStyles.dotPattern} />
          
          <View style={cardStyles.contentRow}>
            <View style={cardStyles.iconWrap}>
              <View style={cardStyles.iconBlob} />
              <Text style={cardStyles.iconEmoji}>{lvl.icon}</Text>
            </View>
            <View style={cardStyles.textWrap}>
              <Text style={cardStyles.title}>{lvl.title}</Text>
              <Text style={cardStyles.desc}>{lvl.desc}</Text>
              <View style={cardStyles.badgeRow}>
                <View style={cardStyles.badge}>
                  <Star size={12} color="#FFF" />
                  <Text style={cardStyles.badgeTxt}>{lvl.wordCount} Words</Text>
                </View>
                <View style={cardStyles.badge}>
                  <Trophy size={12} color="#FFF" />
                  <Text style={cardStyles.badgeTxt}>+5 Pts</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { marginBottom: 22, position: "relative" },
  shadowLayer: { position: "absolute", bottom: -6, left: 4, right: 4, height: "100%", borderRadius: 28, opacity: 0.8 },
  card: { borderRadius: 28, minHeight: 140, padding: 20, overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  dotPattern: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06, borderRadius: 28 },
  contentRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconWrap: { position: "relative", alignItems: "center", justifyContent: "center", width: 60, height: 60 },
  iconBlob: { position: "absolute", width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.25)" },
  iconEmoji: { fontSize: 32 },
  textWrap: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", marginBottom: 6, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  desc: { fontSize: 13, color: "rgba(255,255,255,0.95)", lineHeight: 18, marginBottom: 12, fontWeight: "600" },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.2)", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeTxt: { color: "#FFF", fontSize: 11, fontWeight: "800" },
});


export default function VocabLevelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Deep space gradient background */}
      <LinearGradient
        colors={["#0D001F", "#220050", "#4A0099", "#7B1FD4"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <View style={styles.radialGlow} />

      {/* Header Area */}
      <View style={[styles.headerOuter, { paddingTop: insets.top + 20 }]}>
        <GlowBlob color="#FF4DB8" size={180} style={{ top: -50, right: -50 }} duration={3000} />
        <GlowBlob color="#FFD93D" size={100} style={{ top: 20, left: -20 }} duration={2600} />
        <FloatEmoji emoji="🗣️" size={26} style={{ top: 80, right: 30 }} duration={2000} floatRange={12} />
        <FloatEmoji emoji="✨" size={16} style={{ top: 120, left: 40 }} duration={1800} floatRange={8} />

        <View style={styles.headerNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color="#FFF" size={28} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>Voice Coach</Text>
        <Text style={styles.headerSubtitle}>Choose your difficulty! 🎙️</Text>
        
        <View style={styles.headerPill}>
          <Text style={styles.headerPillTxt}>Level Up Your Speaking</Text>
        </View>
      </View>

      <View style={styles.curveContainer}>
        <View style={styles.curveBg} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <View style={styles.infoIconBox}>
             <Text style={styles.infoIconEmoji}>💡</Text>
          </View>
          <Text style={styles.infoText}>
            Practice speaking English out loud. Our AI Teacher will listen to you and give you points if you pronounce the word correctly!
          </Text>
        </View>

        <View style={styles.levelsContainer}>
          {LEVELS.map((lvl, idx) => (
            <ToyLevelCard
              key={lvl.id}
              lvl={lvl}
              onPress={() => router.push({ pathname: '/vocab_test', params: { level: lvl.id } })}
              delay={100 + idx * 100}
            />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0EBF8" },
  radialGlow: { position: "absolute", top: -80, alignSelf: "center", left: "10%", width: 320, height: 320, borderRadius: 160, backgroundColor: "#8B00FF", opacity: 0.35 },
  headerOuter: { paddingBottom: 40, paddingHorizontal: 22, overflow: "hidden", zIndex: 10, alignItems: "center" },
  headerNav: { width: "100%", flexDirection: "row", justifyContent: "flex-start", marginBottom: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  headerTitle: { fontSize: 36, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5, marginBottom: 4, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  headerSubtitle: { fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: "600", marginBottom: 16 },
  headerPill: { backgroundColor: "#FFD93D", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  headerPillTxt: { fontSize: 13, fontWeight: "900", color: "#2D0060", letterSpacing: 0.5 },
  curveContainer: { height: 28, overflow: "visible", zIndex: 5 },
  curveBg: { position: "absolute", bottom: 0, left: -20, right: -20, height: 60, backgroundColor: "#F0EBF8", borderTopLeftRadius: 36, borderTopRightRadius: 36 },
  scroll: { flex: 1, backgroundColor: "#F0EBF8" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  infoBox: { flexDirection: "row", backgroundColor: "rgba(139, 0, 255, 0.08)", borderRadius: 20, padding: 16, marginBottom: 24, alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(139, 0, 255, 0.15)" },
  infoIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  infoIconEmoji: { fontSize: 20 },
  infoText: { flex: 1, fontSize: 14, color: "#4A0099", fontWeight: "600", lineHeight: 20 },
  levelsContainer: { gap: 4 },
});
