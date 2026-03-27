import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Camera, Search, Trophy, Zap, Star, BookOpen } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/app";

export default function HomeScreen() {
  const router = useRouter();

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
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Zap color="#FF6584" size={20} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <BookOpen color="#43E8D8" size={20} />
              <Text style={styles.statNumber}>0</Text>
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
});
