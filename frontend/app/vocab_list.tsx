import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mic, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const VOCAB_LIST = [
  { word: "Apple", emoji: "🍎", category: "Fruits", grad: ["#FF6B6B", "#FF3E88"], shadow: "#9D003F" },
  { word: "Banana", emoji: "🍌", category: "Fruits", grad: ["#FFD93D", "#FFA500"], shadow: "#B85E00" },
  { word: "Dog", emoji: "🐕", category: "Animals", grad: ["#A855F7", "#7C3AED"], shadow: "#4C1D95" },
  { word: "Cat", emoji: "🐱", category: "Animals", grad: ["#43E8D8", "#00BFFF"], shadow: "#005599" },
  { word: "Car", emoji: "🚗", category: "Transport", grad: ["#2ECC71", "#00A86B"], shadow: "#005A38" },
  { word: "Train", emoji: "🚂", category: "Transport", grad: ["#FF9A9E", "#FECFEF"], shadow: "#D87093" },
  { word: "Sun", emoji: "☀️", category: "Nature", grad: ["#FFD93D", "#FF8C00"], shadow: "#CC5500" },
  { word: "Tree", emoji: "🌳", category: "Nature", grad: ["#4CAF50", "#2E7D32"], shadow: "#1B5E20" },
];

export default function VocabListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Deep space gradient */}
      <LinearGradient colors={["#0D001F", "#220050", "#4A0099", "#7B1FD4"]} style={StyleSheet.absoluteFillObject} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <View style={styles.radialGlow} />

      {/* Header Outer */}
      <View style={[styles.headerOuter, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#FFF" size={26} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Improve Vocab</Text>
        <View style={styles.heroPill}>
          <Text style={styles.heroPillTxt}>Tap a word to practice! 🗣️</Text>
        </View>
      </View>

      <View style={styles.curveContainer}>
        <View style={styles.curveBg} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {VOCAB_LIST.map((item, index) => (
          <View key={index} style={styles.cardWrapOuter}>
            <TouchableOpacity
              style={styles.cardWrap}
              activeOpacity={0.9}
              onPress={() => router.push(`/practice?word=${item.word}&emoji=${item.emoji}`)}
            >
              <View style={[styles.cardShadow, { backgroundColor: item.shadow }]} />
              <LinearGradient colors={item.grad as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
                <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
                <View style={styles.dotPattern} />
                
                <View style={styles.cardContentBox}>
                  <View style={styles.iconBlobWrap}>
                    <View style={styles.iconBlob} />
                    <Text style={styles.cardEmoji}>{item.emoji}</Text>
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.cardWord}>{item.word}</Text>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeTxt}>{item.category}</Text>
                    </View>
                  </View>
                  <View style={styles.actionCircle}>
                    <Mic color="#FFF" size={24} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0EBF8" },
  radialGlow: { position: "absolute", top: -80, alignSelf: "center", left: "10%", width: 320, height: 320, borderRadius: 160, backgroundColor: "#8B00FF", opacity: 0.35 },

  headerOuter: { paddingBottom: 40, paddingHorizontal: 22, overflow: "visible", zIndex: 10, alignItems: "center" },
  headerNav: { width: "100%", flexDirection: "row", justifyContent: "flex-start", marginBottom: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  heroTitle: { fontSize: 36, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5, marginBottom: 12, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  heroPill: { backgroundColor: "#FFD93D", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 2, borderColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  heroPillTxt: { fontSize: 15, fontWeight: "900", color: "#2D0060", letterSpacing: 0.5 },

  curveContainer: { height: 28, overflow: "visible", zIndex: 5 },
  curveBg: { position: "absolute", bottom: 0, left: -20, right: -20, height: 60, backgroundColor: "#F0EBF8", borderTopLeftRadius: 36, borderTopRightRadius: 36 },

  scroll: { flex: 1, backgroundColor: "#F0EBF8" },
  listContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },

  cardWrapOuter: { marginBottom: 20 },
  cardWrap: { position: "relative", width: "100%" },
  cardShadow: { position: "absolute", bottom: -6, left: 4, right: 4, height: "100%", borderRadius: 28, opacity: 0.9 },
  card: { borderRadius: 28, padding: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
  gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  dotPattern: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06, borderRadius: 28 },

  cardContentBox: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconBlobWrap: { position: "relative", alignItems: "center", justifyContent: "center", width: 64, height: 64 },
  iconBlob: { position: "absolute", width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.25)" },
  cardEmoji: { fontSize: 40 },

  textWrap: { flex: 1 },
  cardWord: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", marginBottom: 8, textShadowColor: "rgba(0,0,0,0.2)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  catBadge: { alignSelf: "flex-start", backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  catBadgeTxt: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },

  actionCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
});
