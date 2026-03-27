import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';

import { useGameState, TargetObject } from './hooks/useGameState';
import IslandScene from './components/IslandScene';
import Joystick from './components/Joystick';
import { speakText, stopSpeaking } from '../../../services/audio';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ExpoAV = require('expo-av') as {
  Audio: {
    setAudioModeAsync: (o: Record<string, unknown>) => Promise<void>;
    Sound: {
      createAsync: (
        src: { uri: string },
        opts?: Record<string, unknown>
      ) => Promise<{ sound: { unloadAsync: () => Promise<void> } }>;
    };
  };
};

type Phase = 'loading' | 'exploring' | 'near' | 'won';

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function LoadingOverlay({ emoji, name }: { emoji: string; name: string }) {
  const dot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(dot, { toValue: 1, duration: 1100, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [dot]);

  return (
    <View style={lo.bg}>
      <Text style={lo.emoji}>{emoji}</Text>
      <Text style={lo.title}>Generating Island...</Text>
      <Text style={lo.mission}>Mission:</Text>
      <Text style={lo.obj}>{emoji} Find the {name}</Text>
      <View style={lo.dots}>
        {[0, 0.33, 0.66].map((d, i) => (
          <Animated.View
            key={i}
            style={[lo.dot, {
              opacity: dot.interpolate({
                inputRange: [d, Math.min(d + 0.33, 1), 1],
                outputRange: [0.2, 1, 0.2],
                extrapolate: 'clamp',
              }),
            }]}
          />
        ))}
      </View>
    </View>
  );
}
const lo = StyleSheet.create({
  bg:     { ...StyleSheet.absoluteFillObject, backgroundColor: '#07072a', justifyContent: 'center', alignItems: 'center', zIndex: 50 },
  emoji:  { fontSize: 72, marginBottom: 16 },
  title:  { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 24 },
  mission:{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  obj:    { fontSize: 22, fontWeight: '900', color: '#FFD700', marginBottom: 24 },
  dots:   { flexDirection: 'row', gap: 10 },
  dot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#43E8D8' },
});

// ─── Collect Button ───────────────────────────────────────────────────────────
function CollectButton({ emoji, name, onPress }: {
  emoji: string; name: string; onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0.95)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.95, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={cb.backdrop} pointerEvents="box-none">
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity style={cb.btn} onPress={onPress} activeOpacity={0.8}>
          <Text style={cb.glow}>{emoji}</Text>
          <Text style={cb.label}>You found it!</Text>
          <Text style={cb.name}>{name}</Text>
          <Text style={cb.tap}>👆 TAP TO COLLECT</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
const cb = StyleSheet.create({
  backdrop: { position: 'absolute', bottom: 40, right: 40, alignItems: 'center' },
  btn: {
    backgroundColor: 'rgba(6,8,37,0.92)', borderRadius: 24, paddingVertical: 18, paddingHorizontal: 36,
    alignItems: 'center', borderWidth: 2, borderColor: '#FFD700',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 16,
  },
  glow:  { fontSize: 44, marginBottom: 4 },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  name:  { fontSize: 20, color: '#FFD700', fontWeight: '900', marginBottom: 8 },
  tap:   { fontSize: 12, color: '#43E8D8', fontWeight: '800', letterSpacing: 1.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LingoIslandScreen() {
  const router = useRouter();
  const { targetObject, decoys, score, round, triggerWin, resetGame } = useGameState();
  const joystickRef = useRef({ dx: 0, dz: 0 });
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const soundRef  = useRef<{ unloadAsync: () => Promise<void> } | null>(null);
  const distVoiceTimer = useRef<NodeJS.Timeout | null>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [distHint, setDistHint] = useState<number | null>(null);

  const getDistanceHint = (d: number | null) => {
    if (d === null) return '';
    if (d > 250) return 'Freezing Cold... 🧊';
    if (d > 120) return 'Getting Chilly 🥶';
    if (d > 60) return 'Warm... ☀️';
    if (d > 20) return 'Hot! 🔥';
    return 'Burning Hot!! 🌋';
  };
  // Landscape lock + Forced 2s loading
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
      setPhase('loading');
      const timer = setTimeout(() => {
        setPhase('exploring');
        speakText(`Find the ${targetObject.name}!`);
        startVoiceCooldown(8000);
      }, 2000);

      return () => {
        clearTimeout(timer);
        if (distVoiceTimer.current) clearTimeout(distVoiceTimer.current);
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        soundRef.current?.unloadAsync();
        stopSpeaking();
      };
    }, [targetObject.name])
  );

  // Play win sound
  const playWinSound = useCallback(async () => {
    try {
      await ExpoAV.Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await ExpoAV.Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/buttons/sounds/button-09.mp3' },
        { shouldPlay: true }
      );
      soundRef.current = sound;
    } catch (_) {}
  }, []);

  const startVoiceCooldown = (ms: number) => {
    if (distVoiceTimer.current) clearTimeout(distVoiceTimer.current);
    distVoiceTimer.current = setTimeout(() => {
      distVoiceTimer.current = null;
    }, ms);
  };

  // Distance check callback from GameLoop
  const handleMove = useCallback((_x: number, _z: number, dist: number) => {
    setDistHint(dist);
    setPhase(p => {
      if (p === 'won' || p === 'loading') return p;
      if (dist < 3.5) return 'near';
      return 'exploring';
    });

    if (!distVoiceTimer.current) {
      if (dist < 15) {
        speakText(`You are very near the ${targetObject.name}, look around carefully!`);
        startVoiceCooldown(10000);
      } else if (dist < 40) {
        speakText(`You are getting close to the ${targetObject.name}.`);
        startVoiceCooldown(12000);
      } else if (dist < 100) {
        speakText(`You're heading in the right direction to find the ${targetObject.name}.`);
        startVoiceCooldown(15000);
      }
    }
  }, [targetObject.name]);

  const handleProximityWarning = useCallback((decoy: TargetObject) => {
    if (distVoiceTimer.current) clearTimeout(distVoiceTimer.current);
    stopSpeaking();
    
    speakText(`This is a ${decoy.name}, not the ${targetObject.name}. Keep searching!`);
    startVoiceCooldown(6000);
  }, [targetObject.name]);

  // Tap collect
  const handleCollect = useCallback(() => {
    triggerWin();
    playWinSound();
    setPhase('won');
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 65, useNativeDriver: true }).start();
  }, [triggerWin, playWinSound, scaleAnim]);

  // Next round
  const handleNextRound = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true,
    }).start(() => {
      resetGame();
      joystickRef.current = { dx: 0, dz: 0 };
      setPhase('exploring');
    });
  }, [scaleAnim, resetGame]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar hidden />

      {/* R3F Scene handles camera & player automatically via joystickRef */}
      {phase !== 'loading' && (
        <IslandScene 
          joystick={joystickRef} 
          target={targetObject} 
          decoys={decoys}
          onMove={handleMove} 
          onProximityWarning={handleProximityWarning}
        />
      )}

      {/* Overlays */}
      {phase === 'loading' && <LoadingOverlay emoji={targetObject.emoji} name={targetObject.name} />}

      {(phase === 'exploring' || phase === 'near') && (
        <>
          {/* Top HUD */}
          <View style={styles.hudTop} pointerEvents="none">
            <View style={styles.missionChip}>
              <Text style={styles.missionLabel}>FIND THE</Text>
              <Text style={styles.missionObj}>{targetObject.emoji} {targetObject.name}</Text>
            </View>
            <View style={styles.hudRight}>
              <View style={styles.chip}><Text style={styles.chipTxt}>⭐ {score}</Text></View>
              <View style={[styles.chip, { borderColor: 'rgba(67,232,216,0.3)' }]}>
                <Text style={[styles.chipTxt, { color: '#43E8D8' }]}>#{round}</Text>
              </View>
            </View>
          </View>

          {/* Hint Overlay */}
          {distHint !== null && (
            <View style={{ position: 'absolute', top: 64, width: '100%', alignItems: 'center' }} pointerEvents="none">
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFFFFF', textShadowColor: '#000', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 6 }}>
                {getDistanceHint(distHint)}
              </Text>
            </View>
          )}

          {/* Controls */}
          <Joystick valueRef={joystickRef} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backTxt}>← Back</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Near phase collect button */}
      {phase === 'near' && (
        <CollectButton emoji={targetObject.emoji} name={targetObject.name} onPress={handleCollect} />
      )}

      {/* Won Card (Trading Card Style) */}
      {phase === 'won' && (
        <View style={styles.overlay}>
          <Animated.View style={[styles.winCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.winTitle}>CARD UNLOCKED!</Text>
            
            {/* The Trading Card Hologram Wrapper */}
            <View style={styles.cardInner}>
                <Text style={styles.winEmoji}>{targetObject.emoji}</Text>
                <Text style={styles.winObj}>{targetObject.name}</Text>
                <Text style={{fontSize: 11, color: '#43E8D8', marginTop: 4, fontWeight: '800'}}>Legendary Item ✨</Text>
            </View>

            <View style={styles.stars}>
              {['⭐','⭐','⭐'].map((s, i) => <Text key={i} style={styles.star}>{s}</Text>)}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextRound}>
              <Text style={styles.nextTxt}>Find Next Object 🏝️</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07072a' },
  hudTop: { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 100 },
  missionChip: { backgroundColor: 'rgba(6,8,37,0.7)', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 16, borderWidth: 1, borderColor: '#FFD700', alignItems: 'center' },
  missionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1.5 },
  missionObj: { fontSize: 16, color: '#FFD700', fontWeight: '900' },
  hudRight: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: 'rgba(6,8,37,0.7)', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 13, borderWidth: 1, borderColor: '#FFD700' },
  chipTxt: { color: '#FFD700', fontWeight: '800', fontSize: 14 },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(6,8,37,0.7)', borderRadius: 16, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: '#43E8D8', zIndex: 100 },
  backTxt: { color: '#43E8D8', fontWeight: '700', fontSize: 13 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,8,37,0.7)', justifyContent: 'center', alignItems: 'center' },
  winCard: { backgroundColor: '#1E1E4D', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', borderWidth: 4, borderColor: '#CEE3F6', shadowColor: '#43E8D8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 30, elevation: 20, width: 290 },
  cardInner: { backgroundColor: '#0D1545', borderRadius: 14, paddingVertical: 20, paddingHorizontal: 16, width: '100%', alignItems: 'center', borderWidth: 2, borderColor: '#43E8D8', marginBottom: 16 },
  winEmoji: { fontSize: 56, marginBottom: 8 },
  winTitle: { fontSize: 20, fontWeight: '900', color: '#FFD700', marginBottom: 16, letterSpacing: 1.5 },
  winObj: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  winSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  stars: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  star: { fontSize: 20 },
  nextBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.55, shadowRadius: 12, elevation: 8 },
  nextTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
