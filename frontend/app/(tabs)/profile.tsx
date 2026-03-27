import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";
import { Trophy, Star, Zap, BookOpen, Target, Calendar } from "lucide-react-native";
import { COLORS } from "../../constants/app";

export default function ProfileScreen() {
  // In a real app, this would come from a store/context
  const stats = {
    displayName: "Explorer",
    totalPoints: 0,
    streakCount: 0,
    objectsDetected: 0,
    challengesCompleted: 0,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>🧒</Text>
        </View>
        <Text style={styles.displayName}>{stats.displayName}</Text>
        <View style={styles.pointsBadge}>
          <Star color="#FFD700" size={16} fill="#FFD700" />
          <Text style={styles.pointsText}>{stats.totalPoints} Points</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: "#EDE9FF" }]}>
            <BookOpen color={COLORS.primary} size={28} />
            <Text style={styles.statValue}>{stats.objectsDetected}</Text>
            <Text style={styles.statLabel}>Objects Learned</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: "#FFE8EC" }]}>
            <Target color={COLORS.secondary} size={28} />
            <Text style={styles.statValue}>{stats.challengesCompleted}</Text>
            <Text style={styles.statLabel}>Challenges Won</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: "#E8FFF6" }]}>
            <Zap color={COLORS.success} size={28} />
            <Text style={styles.statValue}>{stats.streakCount}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: "#FFF8E1" }]}>
            <Trophy color="#F39C12" size={28} />
            <Text style={styles.statValue}>{stats.totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementCard}>
          <Text style={styles.achievementEmoji}>🌟</Text>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle}>First Discovery</Text>
            <Text style={styles.achievementDesc}>
              Detect your first object to unlock this!
            </Text>
          </View>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        </View>

        <View style={styles.achievementCard}>
          <Text style={styles.achievementEmoji}>🔥</Text>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle}>3-Day Streak</Text>
            <Text style={styles.achievementDesc}>
              Use the app 3 days in a row!
            </Text>
          </View>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        </View>

        <View style={styles.achievementCard}>
          <Text style={styles.achievementEmoji}>🏆</Text>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle}>Object Hunter</Text>
            <Text style={styles.achievementDesc}>
              Complete 10 finder challenges!
            </Text>
          </View>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        </View>

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
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    fontSize: 40,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    width: "47%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  lockedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  lockedText: {
    fontSize: 18,
  },
});
