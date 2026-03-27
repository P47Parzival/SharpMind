import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Star, ArrowLeft } from "lucide-react-native";
import { api } from "../services/api";
import ConfettiCannon from "react-native-confetti-cannon";

const REWARDS = [
  { id: 1, name: "Golden Robot", emoji: "🤖", cost: 100, bg: "#FFF4E5", borderColor: "#FFE0B2" },
  { id: 2, name: "Magic Wand", emoji: "🪄", cost: 150, bg: "#EDE9FF", borderColor: "#D1C4E9" },
  { id: 3, name: "Space Rocket", emoji: "🚀", cost: 200, bg: "#FFE8EC", borderColor: "#FFCDD2" },
  { id: 4, name: "Story Book", emoji: "📚", cost: 50, bg: "#E8FFF6", borderColor: "#B2DFDB" },
  { id: 5, name: "Yummy Pizza", emoji: "🍕", cost: 30, bg: "#FFE5F1", borderColor: "#F8BBD0" },
  { id: 6, name: "Dino Toy", emoji: "🦕", cost: 120, bg: "#E5FAFF", borderColor: "#B3E5FC" },
];

export default function RedeemScreen() {
  const router = useRouter();
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
      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleRedeem = async (item: typeof REWARDS[0]) => {
    if (loading) return;

    if (points < item.cost) {
      Alert.alert(
        "Need More Points! 🌟",
        `You need ${item.cost - points} more point${
          item.cost - points > 1 ? "s" : ""
        } to get the ${item.name}. Keep exploring!`,
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
              
              if (confettiRef.current) {
                confettiRef.current.start();
              }
            } catch (error) {
              Alert.alert(
                "Error",
                "Could not complete purchase. Check internet connection."
              );
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gift Store</Text>

        <View style={styles.pointsBadge}>
          <Star color="#FFD700" size={16} fill="#FFD700" />
          <Text style={styles.pointsText}>{points}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Redeem Your Points!</Text>
          <Text style={styles.heroSub}>
            Exchange your hard-earned points for awesome rewards.
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {REWARDS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.rewardCard,
                { backgroundColor: item.bg, borderColor: item.borderColor },
              ]}
              activeOpacity={0.8}
              onPress={() => handleRedeem(item)}
              disabled={loading}
            >
              <Text style={styles.rewardEmoji}>{item.emoji}</Text>
              <Text style={styles.rewardName}>{item.name}</Text>
              
              <View
                style={[
                  styles.costBadge,
                  points >= item.cost ? styles.affordable : styles.tooExpensive,
                ]}
              >
                <Star
                  color={points >= item.cost ? "#FFD700" : "#B0BEC5"}
                  size={12}
                  fill={points >= item.cost ? "#FFD700" : "transparent"}
                />
                <Text
                  style={[
                    styles.costText,
                    points >= item.cost ? { color: "#D84315" } : { color: "#607D8B" },
                  ]}
                >
                  {item.cost}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
             <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        )}
      </ScrollView>

      {/* Confetti Animation */}
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6C63FF",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFD700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroBanner: {
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2D3748",
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    color: "#718096",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  rewardCard: {
    width: "47%",
    aspectRatio: 0.9,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  rewardEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  affordable: {
    backgroundColor: "#FFF9C4",
  },
  tooExpensive: {
    backgroundColor: "#ECEFF1",
  },
  costText: {
    fontSize: 13,
    fontWeight: "800",
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  }
});
