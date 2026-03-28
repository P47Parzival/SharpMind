import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';

const MODELS = [
  {
    id: 'heart',
    title: 'Realistic Human Heart',
    desc: 'Explore the amazing pump that keeps you alive!',
    emoji: '🫀',
    gradient: ['#FF6B6B', '#FF3E88', '#C2006F'] as const,
    shadowColor: '#9D003F',
  },
  {
    id: 'body',
    title: 'Upper Body Anatomy',
    desc: 'See the bones, lungs, and organs of the chest!',
    emoji: '🩻',
    gradient: ['#43E8D8', '#00BFFF', '#0077CC'] as const,
    shadowColor: '#005599',
  },
  {
    id: 'full-body',
    title: 'Full Body Ecorche',
    desc: 'Inspect full-body muscle anatomy from head to toe!',
    emoji: '💪',
    gradient: ['#F97316', '#EA580C', '#C2410C'] as const,
    shadowColor: '#9A3412',
  },
  {
    id: 'earth',
    title: 'Earth Model',
    desc: 'Spin and study a 3D view of planet Earth!',
    emoji: '🌍',
    gradient: ['#22C55E', '#0EA5E9', '#2563EB'] as const,
    shadowColor: '#1D4ED8',
  }
];

function ModelCard({ model, onPress, delay }: { model: typeof MODELS[0]; onPress: () => void; delay: number }) {
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
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: Animated.multiply(scaleAnim, pressAnim) }], opacity: opacityAnim }]}>
      <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={[styles.cardShadow, { backgroundColor: model.shadowColor }]} />
        <LinearGradient colors={model.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
          <View style={styles.dotPattern} />
          
          <View style={styles.contentRow}>
            <View style={styles.iconWrap}>
              <View style={styles.iconBlob} />
              <Text style={styles.iconEmoji}>{model.emoji}</Text>
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{model.title}</Text>
              <Text style={styles.desc}>{model.desc}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>Tap to View in 3D</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ARModelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={["#0D001F", "#220050", "#4A0099", "#7B1FD4"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <View style={styles.radialGlow} />

      <View style={[styles.headerOuter, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color="#FFF" size={28} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>3D Magic</Text>
        <Text style={styles.headerSubtitle}>Choose a model to explore! 🥽</Text>
      </View>

      <View style={styles.curveContainer}>
        <View style={styles.curveBg} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.levelsContainer}>
          {MODELS.map((model, idx) => (
            <ModelCard
              key={model.id}
              model={model}
              onPress={() => router.push({ pathname: '/ar-viewer', params: { model: model.id } })}
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
  curveContainer: { height: 28, overflow: "visible", zIndex: 5 },
  curveBg: { position: "absolute", bottom: 0, left: -20, right: -20, height: 60, backgroundColor: "#F0EBF8", borderTopLeftRadius: 36, borderTopRightRadius: 36 },
  scroll: { flex: 1, backgroundColor: "#F0EBF8" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 60 },
  levelsContainer: { gap: 4 },

  cardWrapper: { marginBottom: 22, position: "relative" },
  cardShadow: { position: "absolute", bottom: -6, left: 4, right: 4, height: "100%", borderRadius: 28, opacity: 0.8 },
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
  badge: { alignSelf: 'flex-start', backgroundColor: "rgba(0,0,0,0.2)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14 },
  badgeTxt: { color: "#FFF", fontSize: 12, fontWeight: "800" },
});
