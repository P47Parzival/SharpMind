import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Camera, Home, User } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00E5FF", // Cyber Cyan
        tabBarInactiveTintColor: "#8B72BE", // Muted dark purple
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <View style={styles.glassBackground}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={22} strokeWidth={focused ? 3 : 2} style={styles.iconShift} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Detect",
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={styles.cameraWrapper}>
              <LinearGradient
                colors={["#FF007A", "#7928CA"]} // Premium Magenta/Purple Dribbble aesthetic
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cameraCircle}
              >
                <Camera color="#FFFFFF" size={26} strokeWidth={2.5} />
              </LinearGradient>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={22} strokeWidth={focused ? 3 : 2} style={styles.iconShift} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    borderWidth: 0,
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: "transparent",
    paddingBottom: Platform.OS === "ios" ? 0 : 0, // Prevent default safe area pushing text out
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: Platform.OS === 'ios' ? 12 : 10,
  },
  iconShift: {
    marginTop: Platform.OS === 'ios' ? 10 : 6,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    overflow: "hidden",
    backgroundColor: "rgba(10, 2, 20, 0.7)", 
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cameraWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1A0533",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Platform.OS === 'ios' ? -5 : 0, // Precisely center the big button
    shadowColor: "#FF007A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  cameraCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
});
