import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Star, TrendingUp, Trophy } from 'lucide-react-native';

const LEVELS = [
    {
        id: '1',
        title: 'Level 1: Easy Peasy',
        desc: 'Perfect for starters! Simple words like Apple, Cat, and Sun.',
        icon: '🟢',
        gradient: ['#A5D6A7', '#4CAF50'] as const,
        iconBg: 'rgba(255,255,255,0.3)',
        wordCount: 10
    },
    {
        id: '2',
        title: 'Level 2: Getting Tricky',
        desc: 'Intermediate phonetics! Words like Yellow, Turtle, and Breakfast.',
        icon: '🟡',
        gradient: ['#FFF59D', '#FBC02D'] as const,
        iconBg: 'rgba(255,255,255,0.4)',
        wordCount: 15
    },
    {
        id: '3',
        title: 'Level 3: Brain Bender',
        desc: 'The ultimate challenge! Words like Mississippi and Encyclopedia.',
        icon: '🔴',
        gradient: ['#EF9A9A', '#E53935'] as const,
        iconBg: 'rgba(255,255,255,0.3)',
        wordCount: 12
    }
];

export default function VocabLevelsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft color="#333" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Voice Coach</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.subtitle}>Choose your difficulty!</Text>
                <Text style={styles.description}>
                    Practice speaking English out loud. Our AI Teacher will listen to you and give you points if you pronounce the word correctly!
                </Text>

                <View style={styles.levelsContainer}>
                    {LEVELS.map((lvl) => (
                        <TouchableOpacity
                            key={lvl.id}
                            activeOpacity={0.8}
                            onPress={() => router.push({ pathname: '/vocab_test', params: { level: lvl.id } })}
                        >
                            <LinearGradient colors={lvl.gradient} style={styles.levelCard}>
                                <View style={[styles.iconBox, { backgroundColor: lvl.iconBg }]}>
                                    <Text style={styles.levelEmoji}>{lvl.icon}</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{lvl.title}</Text>
                                    <Text style={styles.cardDesc}>{lvl.desc}</Text>
                                    <View style={styles.badgeContainer}>
                                        <View style={styles.badge}>
                                            <Star size={14} color="#FFF" />
                                            <Text style={styles.badgeTxt}>{lvl.wordCount} Words</Text>
                                        </View>
                                        <View style={styles.badge}>
                                            <Trophy size={14} color="#FFF" />
                                            <Text style={styles.badgeTxt}>+5 Pts</Text>
                                        </View>
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE',
    },
    backButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F7',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
    scrollContent: { padding: 24 },
    subtitle: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 12 },
    description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 32 },
    levelsContainer: { gap: 16 },
    levelCard: {
        borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
    },
    iconBox: {
        width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    },
    levelEmoji: { fontSize: 26 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.95)', lineHeight: 18, marginBottom: 12 },
    badgeContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(0,0,0,0.15)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12,
    },
    badgeTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});