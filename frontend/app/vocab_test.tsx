import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Audio } from 'expo-av';
import { Mic, ChevronLeft, Volume2, Trophy, ArrowRight, RefreshCcw } from 'lucide-react-native';
import { api } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const LEVEL_WORDS: Record<string, string[]> = {
  '1': ['Apple', 'Cat', 'Dog', 'Sun', 'Moon', 'Tree', 'Car', 'Book', 'Fish', 'Mango', 'Bird', 'Ball', 'House', 'Milk', 'Cake'],
  '2': ['Yellow', 'Window', 'Happy', 'Turtle', 'Breakfast', 'Penguin', 'Monkey', 'Castle', 'Elephant', 'Bicycle', 'Butterfly', 'Rainbow', 'Dinosaur'],
  '3': ['Miscellaneous', 'Mississippi', 'Encyclopedia', 'Rhinoceros', 'Hippopotamus', 'Thermometer', 'Pterodactyl', 'Unbelievable', 'Extraordinary', 'Photosynthesis', 'Magniloquent', 'Ambidextrous']
};

export default function VocabTestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const levelId = params.level as string || '1';
  
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

  useEffect(() => {
    pickWord();
    // Request permissions
    Audio.requestPermissionsAsync().catch(console.error);
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }, []);

  const pickWord = () => {
    const words = LEVEL_WORDS[levelId] || LEVEL_WORDS['1'];
    const w = words[Math.floor(Math.random() * words.length)];
    setTargetWord(w);
    setShowResult(false);
    setIsProcessing(false);
  };

  const startRecording = async () => {
    try {
      setShowResult(false);
      setIsRecording(true);
      
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      ).start();

      const { recording: newRec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRec);
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);

    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        processAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const processAudio = async (uri: string) => {
    setIsProcessing(true);
    try {
      const result = await api.checkPronunciation(targetWord, uri);
      setIsCorrect(result.is_correct);
      setFeedback(result.feedback);
      setPtsEarned(result.points_earned);
      setShowResult(true);
    } catch (err) {
      console.error('API processing failed', err);
      // Fallback UI gracefully
      setIsCorrect(false);
      setFeedback("Sorry, I couldn't understand that. Please speak louder!");
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#333" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Level {levelId}</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.promptLabel}>Say this word out loud:</Text>
        <Text style={styles.targetWord}>{targetWord}</Text>

        <View style={styles.micArea}>
          {isProcessing ? (
            <View style={styles.processingBox}>
              <ActivityIndicator size="large" color="#6C63FF" />
              <Text style={styles.processingTxt}>AI is listening...</Text>
            </View>
          ) : showResult ? (
            <View style={[styles.resultCard, isCorrect ? styles.resultSuccess : styles.resultFail]}>
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
                <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setShowResult(false)}>
                  <RefreshCcw size={20} color={isCorrect ? '#2E7D32' : '#C62828'} />
                  <Text style={[styles.actionBtnTxt, { color: isCorrect ? '#2E7D32' : '#C62828' }]}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isCorrect ? '#2E7D32' : '#C62828' }]} onPress={pickWord}>
                  <Text style={styles.actionBtnTxtWhite}>Next Word</Text>
                  <ArrowRight size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Animated.View style={[styles.micGlow, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.4 : 0 }]} />
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                style={[styles.micButton, isRecording && styles.micRecording]}
              >
                <Mic size={48} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.micInstruction}>
                {isRecording ? "Listening... Release to check!" : "Hold to Speak"}
              </Text>
            </>
          )}
        </View>
      </View>
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
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  promptLabel: { fontSize: 18, color: '#666', fontWeight: '600', marginBottom: 16 },
  targetWord: { fontSize: 48, fontWeight: '900', color: '#6C63FF', letterSpacing: 2, textAlign: 'center' },
  
  micArea: { marginTop: 80, alignItems: 'center', height: 300, justifyContent: 'center', width: '100%' },
  micButton: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#6C63FF',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  micRecording: { backgroundColor: '#FF5252', shadowColor: '#FF5252' },
  micGlow: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: '#FF5252', zIndex: 1,
  },
  micInstruction: { marginTop: 32, fontSize: 18, fontWeight: '700', color: '#888' },
  
  processingBox: { alignItems: 'center', gap: 16 },
  processingTxt: { fontSize: 18, fontWeight: '700', color: '#6C63FF' },

  resultCard: {
    width: '100%', padding: 32, borderRadius: 32, alignItems: 'center', borderWidth: 2,
    backgroundColor: '#FFF'
  },
  resultSuccess: { borderColor: '#81C784', backgroundColor: '#F1F8E9' },
  resultFail: { borderColor: '#E57373', backgroundColor: '#FFEBEE' },
  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultTitle: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 12 },
  resultFeedback: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  
  ptsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A1A1A',
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginBottom: 32,
  },
  ptsTxt: { color: '#FFD700', fontWeight: '800', fontSize: 16 },
  
  actionRow: { flexDirection: 'row', gap: 16, width: '100%' },
  actionBtnOutline: {
    flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
  },
  actionBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
  },
  actionBtnTxt: { fontSize: 16, fontWeight: '800' },
  actionBtnTxtWhite: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
