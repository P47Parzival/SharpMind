import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Audio } from 'expo-av';
import { Mic, ChevronLeft, Volume2, Trophy, ArrowRight, RefreshCcw } from 'lucide-react-native';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';

const LEVEL_WORDS: Record<string, Record<string, string[]>> = {
    'en-US': {
        '1': ['Apple', 'Cat', 'Dog', 'Sun', 'Moon', 'Tree', 'Car', 'Book', 'Fish', 'Mango', 'Bird', 'Ball', 'House', 'Milk', 'Cake'],
        '2': ['Yellow', 'Window', 'Happy', 'Turtle', 'Breakfast', 'Penguin', 'Monkey', 'Castle', 'Elephant', 'Bicycle', 'Butterfly', 'Rainbow', 'Dinosaur'],
        '3': ['Miscellaneous', 'Mississippi', 'Encyclopedia', 'Rhinoceros', 'Hippopotamus', 'Thermometer', 'Pterodactyl', 'Unbelievable', 'Extraordinary', 'Photosynthesis', 'Magniloquent', 'Ambidextrous'],
    },
    'es-ES': {
        '1': ['Manzana', 'Gato', 'Perro', 'Sol', 'Luna', 'Árbol', 'Coche', 'Libro', 'Pez', 'Mango'],
        '2': ['Amarillo', 'Ventana', 'Feliz', 'Tortuga', 'Desayuno', 'Pingüino', 'Mariposa', 'Arcoíris', 'Elefante', 'Bicicleta'],
        '3': ['Enciclopedia', 'Extraordinario', 'Hipopótamo', 'Termómetro', 'Responsabilidad', 'Pronunciación', 'Arquitectura', 'Fotografía'],
    },
    'de-DE': {
        '1': ['Apfel', 'Katze', 'Hund', 'Sonne', 'Mond', 'Baum', 'Auto', 'Buch', 'Fisch', 'Kuchen'],
        '2': ['Gelb', 'Fenster', 'Frühstück', 'Schildkröte', 'Pinguin', 'Schmetterling', 'Regenbogen', 'Elefant', 'Fahrrad'],
        '3': ['Enzyklopädie', 'Außergewöhnlich', 'Hippopotamus', 'Thermometer', 'Aussprache', 'Verantwortung', 'Wissenschaft'],
    },
    'hi-IN': {
        '1': ['सेब', 'बिल्ली', 'कुत्ता', 'सूरज', 'चाँद', 'पेड़', 'गाड़ी', 'किताब', 'मछली', 'दूध'],
        '2': ['पीला', 'खिड़की', 'खुश', 'कछुआ', 'नाश्ता', 'तितली', 'इंद्रधनुष', 'हाथी', 'साइकिल'],
        '3': ['विश्वकोश', 'असाधारण', 'उच्चारण', 'जिम्मेदारी', 'पर्यावरण', 'विज्ञान', 'संविधान'],
    },
};

export default function VocabTestScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const levelId = params.level as string || '1';
    const languageCode = (params.languageCode as string) || 'en-US';
    const languageLabel = (params.languageLabel as string) || 'English';

    const [targetWord, setTargetWord] = useState('');
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Results
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [ptsEarned, setPtsEarned] = useState(0);

    // Animation
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const resultScaleAnim = useRef(new Animated.Value(0.5)).current;
    const resultOpacityAnim = useRef(new Animated.Value(0)).current;
    const activeRecordingRef = useRef<Audio.Recording | null>(null);
    const preparingRecordingRef = useRef(false);

    useEffect(() => {
        pickWord();
        // Request permissions
        Audio.requestPermissionsAsync().catch(console.error);
        Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });
        return () => {
            Speech.stop();
            const rec = activeRecordingRef.current;
            activeRecordingRef.current = null;
            if (rec) {
                rec.stopAndUnloadAsync().catch(() => {});
            }
        };
    }, []);

    const pickWord = () => {
        const byLanguage = LEVEL_WORDS[languageCode] || LEVEL_WORDS['en-US'];
        const words = byLanguage[levelId] || byLanguage['1'];
        const w = words[Math.floor(Math.random() * words.length)];
        setTargetWord(w);
        setShowResult(false);
        setIsProcessing(false);
        Speech.stop();
        Speech.speak(w, { language: languageCode, rate: 0.9, pitch: 1.0 });
    };

    const startRecording = async () => {
        if (preparingRecordingRef.current || activeRecordingRef.current || isRecording || isProcessing) {
            return;
        }

        preparingRecordingRef.current = true;
        try {
            setShowResult(false);

            // Start pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
                ])
            ).start();

            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                throw new Error('Microphone permission denied.');
            }

            const newRec = new Audio.Recording();
            await newRec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await newRec.startAsync();

            activeRecordingRef.current = newRec;
            setRecording(newRec);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            setIsRecording(false);
            const rec = activeRecordingRef.current;
            activeRecordingRef.current = null;
            if (rec) {
                await rec.stopAndUnloadAsync().catch(() => {});
            }
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
            setFeedback('Microphone failed to start. Please try again.');
            setShowResult(true);
            showResultAnim();
        } finally {
            preparingRecordingRef.current = false;
        }
    };

    const stopRecording = async () => {
        if (preparingRecordingRef.current) return;

        setIsRecording(false);
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);

        const rec = activeRecordingRef.current || recording;
        if (!rec) return;

        activeRecordingRef.current = null;
        setRecording(null);

        try {
            await rec.stopAndUnloadAsync();
            const uri = rec.getURI();

            if (uri) {
                processAudio(uri);
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
            setFeedback('Could not process recording. Please try again.');
            setShowResult(true);
            showResultAnim();
        }
    };

    const processAudio = async (uri: string) => {
        setIsProcessing(true);
        try {
            const result = await api.checkPronunciation(targetWord, uri, languageCode);
            setIsCorrect(result.is_correct);
            setFeedback(result.feedback);
            setPtsEarned(result.points_earned);
            showResultAnim();
        } catch (err) {
            console.error('API processing failed', err);
            // Fallback UI gracefully
            setIsCorrect(false);
            setFeedback("Sorry, I couldn't understand that. Please speak louder!");
            showResultAnim();
        } finally {
            setIsProcessing(false);
        }
    };

    const showResultAnim = () => {
        setShowResult(true);
        resultScaleAnim.setValue(0.5);
        resultOpacityAnim.setValue(0);
        Animated.parallel([
            Animated.spring(resultScaleAnim, { toValue: 1, tension: 150, friction: 8, useNativeDriver: true }),
            Animated.timing(resultOpacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    };

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
                <View style={styles.headerNav}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ChevronLeft color="#FFF" size={28} />
                    </TouchableOpacity>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeTxt}>LEVEL {levelId} • {languageLabel}</Text>
                    </View>
                </View>

                <Animated.View style={{ alignItems: "center" }}>
                    <Text style={styles.headerSubtitle}>Say this word out loud 🎙️</Text>
                    <View style={styles.wordPill}>
                        <Text style={styles.targetWord}>{targetWord}</Text>
                    </View>
                </Animated.View>
            </View>

            {/* Curved Divider */}
            <View style={styles.curveContainer}>
                <View style={styles.curveBg} />
            </View>

            <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: "#F0EBF8" }}>
                <View style={styles.micArea}>
                    {isProcessing ? (
                        <View style={styles.processingBox}>
                            <View style={styles.spinnerBlob}>
                                <ActivityIndicator size="large" color="#FFD93D" />
                            </View>
                            <Text style={styles.processingTxt}>AI is listening... 🧠</Text>
                        </View>
                    ) : showResult ? (
                        <Animated.View style={[styles.resultCardWrap, { transform: [{ scale: resultScaleAnim }], opacity: resultOpacityAnim }]}>
                            <View style={[styles.resultShadow, { backgroundColor: isCorrect ? "#008A4D" : "#9D003F" }]} />
                            <LinearGradient
                                colors={isCorrect ? ["#2ECC71", "#00A86B", "#007A50"] : ["#FF6B6B", "#FF3E88", "#C2006F"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.resultCard}
                            >
                                <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
                                <View style={styles.dotPattern} />

                                <Text style={styles.resultEmoji}>{isCorrect ? '🎉' : '🤔'}</Text>
                                <Text style={styles.resultTitle}>{isCorrect ? 'Awesome!' : 'Almost there!'}</Text>
                                <Text style={styles.resultFeedback}>{feedback}</Text>
                                {ptsEarned > 0 && (
                                    <View style={styles.ptsBadge}>
                                        <Trophy size={18} color="#FFD700" />
                                        <Text style={styles.ptsTxt}>+{ptsEarned} Points!</Text>
                                    </View>
                                )}

                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.actionBtnOutline} onPress={() => showResultAnim() /* Re-hide result actually handled by pickword, but retry means pick again or try same word? */}>
                                        <RefreshCcw size={20} color="#FFF" />
                                        <Text style={styles.actionBtnTxtWhite}>Retry</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={pickWord}>
                                        <Text style={styles.actionBtnTxt}>Next Word</Text>
                                        <ArrowRight size={20} color="#000" />
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Animated.View style={[styles.micGlow, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }]} />
                            <TouchableOpacity
                                activeOpacity={1}
                                onPressIn={startRecording}
                                onPressOut={stopRecording}
                                style={styles.micButtonWrap}
                            >
                                <View style={[styles.micShadow, isRecording && { bottom: -2, height: '98%' }]} />
                                <LinearGradient 
                                    colors={isRecording ? ["#FF3E88", "#C2006F"] : ["#FFD93D", "#FFA500"]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={[styles.micButton, isRecording && { transform: [{ translateY: 4 }] }]}
                                >
                                    <LinearGradient colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.gloss} />
                                    <Mic size={54} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                            <Text style={styles.micInstruction}>
                                {isRecording ? "Listening... Release to check!" : "Hold to Speak"}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0EBF8' },
    radialGlow: { position: "absolute", top: -80, alignSelf: "center", left: "10%", width: 320, height: 320, borderRadius: 160, backgroundColor: "#8B00FF", opacity: 0.35 },
    headerOuter: { paddingBottom: 40, paddingHorizontal: 22, overflow: "visible", zIndex: 10 },
    headerNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
    levelBadge: { backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    levelBadgeTxt: { color: "#FFF", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
    headerSubtitle: { fontSize: 18, color: "rgba(255,255,255,0.9)", fontWeight: "700", marginBottom: 16 },
    wordPill: { backgroundColor: "#FFFFFF", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 32, borderWidth: 3, borderColor: "#FFD93D", shadowColor: "#FFD93D", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 8, transform: [{ rotate: "-2deg" }] },
    targetWord: { fontSize: 44, fontWeight: "900", color: "#6C63FF", letterSpacing: 1, textAlign: "center" },

    curveContainer: { height: 28, overflow: "visible", zIndex: 5 },
    curveBg: { position: "absolute", bottom: 0, left: -20, right: -20, height: 60, backgroundColor: "#F0EBF8", borderTopLeftRadius: 36, borderTopRightRadius: 36 },

    contentScroll: { flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },

    micArea: { alignItems: 'center', justifyContent: 'center', width: '100%' },
    micButtonWrap: { position: "relative", width: 140, height: 140, marginBottom: 20, zIndex: 10 },
    micShadow: { position: "absolute", bottom: -8, left: 4, right: 4, height: "100%", borderRadius: 70, backgroundColor: "rgba(0,0,0,0.3)" },
    micButton: { flex: 1, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: "rgba(255,255,255,0.6)", overflow: "hidden" },
    micGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFD93D', top: -30, zIndex: 1 },
    micInstruction: { fontSize: 18, fontWeight: '800', color: '#6C63FF' },

    processingBox: { alignItems: 'center', gap: 16 },
    spinnerBlob: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#6C63FF", alignItems: "center", justifyContent: "center", shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
    processingTxt: { fontSize: 18, fontWeight: '800', color: '#6C63FF' },

    resultCardWrap: { width: "100%", position: "relative" },
    resultShadow: { position: "absolute", bottom: -8, left: 6, right: 6, height: "100%", borderRadius: 32, opacity: 0.8 },
    resultCard: { width: '100%', padding: 20, borderRadius: 32, alignItems: 'center', borderWidth: 2, borderColor: "rgba(255,255,255,0.4)", overflow: "hidden" },
    gloss: { position: "absolute", top: 0, left: 0, right: 0, height: "50%" },
    dotPattern: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, borderRadius: 32 },

    resultEmoji: { fontSize: 54, marginBottom: 12 },
    resultTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', marginBottom: 8, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    resultFeedback: { fontSize: 15, color: 'rgba(255,255,255,0.95)', textAlign: 'center', lineHeight: 22, marginBottom: 16, fontWeight: "600" },

    ptsBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginBottom: 20 },
    ptsTxt: { color: '#FFD700', fontWeight: '900', fontSize: 15 },

    actionRow: { flexDirection: 'row', gap: 10, width: '100%' },
    actionBtnOutline: { flex: 1, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: "rgba(255,255,255,0.1)", alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    actionBtn: { flex: 1, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 16, backgroundColor: "#FFF", alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    actionBtnTxt: { fontSize: 13, fontWeight: '900', color: "#000" },
    actionBtnTxtWhite: { fontSize: 13, fontWeight: '800', color: '#FFF' },
});