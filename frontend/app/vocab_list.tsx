import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mic } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const VOCAB_LIST = [
  { word: "Apple", emoji: "🍎", category: "Fruits" },
  { word: "Banana", emoji: "🍌", category: "Fruits" },
  { word: "Dog", emoji: "🐕", category: "Animals" },
  { word: "Cat", emoji: "🐱", category: "Animals" },
  { word: "Car", emoji: "🚗", category: "Transport" },
  { word: "Train", emoji: "🚂", category: "Transport" },
  { word: "Sun", emoji: "☀️", category: "Nature" },
  { word: "Tree", emoji: "🌳", category: "Nature" },
];

export default function VocabListScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FF9A9E", "#FECFEF"]} style={styles.headerGlow} />
      
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Text style={{ fontSize: 32 }}>🗣️</Text>
        </View>
        <Text style={styles.title}>Improve Vocab</Text>
        <Text style={styles.subtitle}>Tap a word to practice your pronunciation!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {VOCAB_LIST.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(`/practice?word=${item.word}&emoji=${item.emoji}`)}
          >
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardWord}>{item.word}</Text>
              <Text style={styles.cardCategory}>{item.category}</Text>
            </View>
            <View style={styles.cardAction}>
              <Mic color="#FF6B6B" size={24} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.15,
  },
  header: {
    padding: 24,
    alignItems: "center",
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF9A9E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardWord: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
  cardAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
});
