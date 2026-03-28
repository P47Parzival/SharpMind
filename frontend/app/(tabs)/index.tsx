import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Camera, Search, Trophy, Zap, Star, BookOpen, Map } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/app";
import { api } from "../../services/api";

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPoints: 0,
    streakCount: 0,
    objectsDetected: 0,
  });

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

      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hello, Explorer! 👋</Text>
            <Text style={styles.subtitle}>What do you want to learn today?</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Star color="#FFD700" size={20} />
              <Text style={styles.statNumber}>{stats.totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Zap color="#FF6584" size={20} />
              <Text style={styles.statNumber}>{stats.streakCount}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <BookOpen color="#43E8D8" size={20} />
              <Text style={styles.statNumber}>{stats.objectsDetected}</Text>
              <Text style={styles.statLabel}>Objects</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/camera")}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#EDE9FF" }]}>
            <Camera color={COLORS.primary} size={32} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>🔍 Detect Object</Text>
            <Text style={styles.actionDescription}>
              Point your camera at anything to learn its name!
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/finder")}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#FFE8EC" }]}>
            <Search color={COLORS.secondary} size={32} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>🎯 Object Finder</Text>
            <Text style={styles.actionDescription}>
              Find objects around you and earn rewards!
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/vocab_levels")}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#FFF4E5" }]}>
            <Text style={{ fontSize: 32 }}>🎙️</Text>
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>🗣️ Improve Vocab</Text>
            <Text style={styles.actionDescription}>
              Practice saying words aloud with your smart voice coach!
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#E8FFF6" }]}>
            <Trophy color={COLORS.success} size={32} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>🏆 My Rewards</Text>
            <Text style={styles.actionDescription}>
              Check your points, streaks, and achievements!
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Lingo Island Banner (Night Theme) ── */}
        <TouchableOpacity
          style={[styles.actionCard, styles.islandCard]}
          onPress={() => router.push("/lingo-island" as any)}
          activeOpacity={0.82}
          accessibilityLabel="Enter Lingo Island"
        >
          <View style={[styles.actionIcon, styles.islandIcon]}>
            <Map color="#43E8D8" size={32} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: "#43E8D8" }]}>
              🏝️ Lingo Island
            </Text>
            <Text style={[styles.actionDescription, { color: "rgba(255,255,255,0.65)" }]}>
              Explore a real 3D island at night!
            </Text>
          </View>
          <View style={styles.islandBadge}>
            <Text style={styles.islandBadgeText}>3D</Text>
          </View>
        </TouchableOpacity>

        {/* Reedem Store */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/redeem")}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#FFE5F1" }]}>
            <Text style={{ fontSize: 32 }}>🎁</Text>
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>🛍️ Redeem Points</Text>
            <Text style={styles.actionDescription}>
              Exchange your points for awesome digital toys and treats!
            </Text>
          </View>
        </TouchableOpacity>

        {/* AR Specialty */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/ar-viewer")}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#E3FEF7" }]}>
            <Text style={{ fontSize: 32 }}>🥽</Text>
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>🧬 AR Specialty</Text>
            <Text style={styles.actionDescription}>
              Project realistic 3D human anatomy models right into your living room!
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tip of the Day */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Did you know?</Text>
          <Text style={styles.tipText}>
            Learning new words every day helps your brain grow stronger! Try detecting
            5 objects today to earn bonus points! 🎉
          </Text>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
  },
  headerContent: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },
  actionCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  tipCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F57F17",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#795548",
    lineHeight: 20,
  },
  islandCard: {
    backgroundColor: "#060825",
    borderWidth: 1.5,
    borderColor: "rgba(67,232,216,0.45)",
    shadowColor: "#43E8D8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  islandIcon: {
    backgroundColor: "rgba(67,232,216,0.12)",
    borderWidth: 1,
    borderColor: "rgba(67,232,216,0.3)",
  },
  islandBadge: {
    backgroundColor: "#6C63FF",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  islandBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});
