import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import {
  ViroARSceneNavigator,
  ViroARScene,
  Viro3DObject,
  ViroAmbientLight,
  ViroSpotLight,
  ViroNode,
  ViroSkyBox
} from '../components/ViroSafe';
import { ArrowLeft, Lock, Unlock, RotateCcw, RotateCw, ZoomIn, ZoomOut, Moon, Sun, ArrowUp, ArrowDown, Volume2 } from 'lucide-react-native';
import { speakText, stopSpeaking } from '../services/audio';

const HeartSceneAR = (props: any) => {
  const { isLocked, controlRotation, controlTilt, controlScale, modelSource, modelType, isBlackout } = props.sceneNavigator.viroAppProps;

  // Base transforms mixed with 2D controls
  const [dragRotation, setDragRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [dragScale, setDragScale] = useState<[number, number, number]>([0.15, 0.15, 0.15]);

  const baseScale = React.useRef(0.15);
  const baseRotation = React.useRef(0);

  const onRotate = (rotateState: number, rotationFactor: number) => {
    if (isLocked) return;
    if (rotateState === 1) {
      baseRotation.current = dragRotation[1];
    } else if (rotateState === 2 || rotateState === 3) {
      setDragRotation([dragRotation[0], baseRotation.current - rotationFactor, dragRotation[2]]);
    }
  };

  const onPinch = (pinchState: number, scaleFactor: number) => {
    if (isLocked) return;
    if (pinchState === 1) {
      baseScale.current = dragScale[0];
    } else if (pinchState === 2 || pinchState === 3) {
      const newScale = Math.max(0.01, baseScale.current * scaleFactor);
      setDragScale([newScale, newScale, newScale]);
    }
  };

  return (
    <ViroARScene>
      {isBlackout && <ViroSkyBox color="#000000" />}
      <ViroAmbientLight color="#ffffff" intensity={300} />
      <ViroSpotLight
        innerAngle={5}
        outerAngle={90}
        direction={[0, -1, -0.2]}
        position={[0, 3, 1]}
        color="#ffffff"
        castsShadow={true}
      />

      <ViroNode
        position={[0, -0.2, -1.2]}
        dragType="FixedToWorld"
        onDrag={() => { }}
        ignoreEventHandling={isLocked}
        scale={[dragScale[0] * controlScale, dragScale[1] * controlScale, dragScale[2] * controlScale]}
        rotation={[dragRotation[0] + controlTilt, dragRotation[1] + controlRotation, dragRotation[2]]}
        // @ts-ignore
        onRotation={onRotate}
        // @ts-ignore
        onPinch={onPinch}
      >
        <Viro3DObject
          source={modelSource}
          position={[0, 0, 0]}
          type={modelType}
        />
      </ViroNode>
    </ViroARScene>
  );
};

const SPEECH_LANGUAGES = [
  { label: 'English', code: 'en-US' },
  { label: 'Hindi', code: 'hi-IN' },
];

export default function ARViewerScreen() {
  const router = useRouter();
  const { model, remoteModelUrl, remoteModelName, remoteModelType } = useLocalSearchParams();

  // Select matching GLB. Defaults to Heart if nothing passed or unknown id is received.
  const modelKey = typeof model === 'string' ? model : 'heart';
  const modelSourceMap: Record<string, any> = {
    heart: require("../glbfiles/realistic_human_heart.glb"),
    body: require("../glbfiles/upper_body_anatomy.glb"),
    'full-body': require("../glbfiles/male_full_body_ecorche.glb"),
    earth: require("../glbfiles/earth.glb"),
  };
  const modelNarrationMap: Record<string, string> = {
    heart: 'This is the human heart. It pumps blood to every part of your body and keeps you alive every second.',
    body: 'This is the upper body anatomy model. You can explore important structures like ribs, lungs, and major organs in the chest.',
    'full-body': 'This is a full body ecorche model. It shows muscles across the whole body so you can study how the human body is built for movement.',
    earth: 'This is planet Earth. Most of Earth is covered by water, and it is the only known planet that supports life.',
  };
  const modelNarrationHindiMap: Record<string, string> = {
    heart: 'यह मानव हृदय है। यह आपके पूरे शरीर में रक्त पहुंचाता है और आपको हर पल जीवित रखता है।',
    body: 'यह ऊपरी शरीर की एनाटॉमी का मॉडल है। इसमें आप पसलियां, फेफड़े और छाती के महत्वपूर्ण अंग देख सकते हैं।',
    'full-body': 'यह पूरे शरीर की मांसपेशियों का मॉडल है। इससे आप समझ सकते हैं कि हमारा शरीर कैसे बना है और कैसे चलता है।',
    earth: 'यह पृथ्वी ग्रह का मॉडल है। पृथ्वी का अधिकतर भाग पानी से ढका है और यही एक ज्ञात ग्रह है जहां जीवन संभव है।',
  };
  const isRemoteModel = typeof remoteModelUrl === 'string' && remoteModelUrl.length > 0;
  const modelSource = isRemoteModel
    ? { uri: remoteModelUrl as string }
    : (modelSourceMap[modelKey] ?? modelSourceMap.heart);
  const modelType = isRemoteModel
    ? (typeof remoteModelType === 'string' ? remoteModelType : 'GLTF')
    : 'GLB';
  const remoteLabel = typeof remoteModelName === 'string' && remoteModelName.trim().length > 0
    ? remoteModelName.trim()
    : 'this downloaded 3D model';
  const modelNarration = modelNarrationMap[modelKey] ?? modelNarrationMap.heart;
  const modelNarrationHindi = modelNarrationHindiMap[modelKey] ?? modelNarrationHindiMap.heart;

  const [isLocked, setIsLocked] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [controlRotation, setControlRotation] = useState(0);
  const [controlTilt, setControlTilt] = useState(0);
  const [controlScale, setControlScale] = useState(1);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    // Stop speech if user switches model while narration is active.
    stopSpeaking();
    return () => {
      stopSpeaking();
    };
  }, [modelKey]);

  const handleSpeak = (languageCode: string) => {
    const narration = isRemoteModel
      ? (languageCode === 'hi-IN'
          ? `यह ${remoteLabel} मॉडल है। आप इसे घुमाकर और ज़ूम करके अच्छी तरह देख सकते हैं।`
          : `This is ${remoteLabel}. You can rotate and zoom to explore it in detail.`)
      : (languageCode === 'hi-IN' ? modelNarrationHindi : modelNarration);
    speakText(narration, languageCode);
    setShowLanguagePicker(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          // @ts-ignore
          scene: HeartSceneAR,
        }}
        viroAppProps={{ isLocked, controlRotation, controlTilt, controlScale, modelSource, modelType, isBlackout }}
        style={styles.arView}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={20} />
          <Text style={styles.backTxt}>Exit</Text>
        </TouchableOpacity>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={styles.lockBtn}
            onPress={() => setShowLanguagePicker(v => !v)}
          >
            <Volume2 color="#fff" size={17} />
            <Text style={styles.backTxt}>Voice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.lockBtn, isBlackout && styles.lockBtnActive]}
            onPress={() => setIsBlackout(!isBlackout)}
          >
            {isBlackout ? <Moon color="#fff" size={17} /> : <Sun color="#fff" size={17} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.lockBtn, isLocked && styles.lockBtnActive]}
            onPress={() => setIsLocked(!isLocked)}
          >
            {isLocked ? <Lock color="#fff" size={17} /> : <Unlock color="#fff" size={17} />}
            <Text style={styles.backTxt}>{isLocked ? 'Locked' : 'Unlock'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showLanguagePicker && (
        <View style={styles.langPickerCard}>
          <Text style={styles.langPickerTitle}>Choose narration language</Text>
          <View style={styles.langPickerRow}>
            {SPEECH_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.langBtn}
                onPress={() => handleSpeak(lang.code)}
              >
                <Text style={styles.langBtnText}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.langCancelBtn} onPress={() => setShowLanguagePicker(false)}>
            <Text style={styles.langCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2D On-Screen Controls for Small Phones */}
      <View style={styles.hudContainer}>
        <View style={styles.hudRow}>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setControlScale(s => Math.max(0.2, s - 0.2))}>
            <ZoomOut color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.hudLabel}>Scale</Text>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setControlScale(s => s + 0.2)}>
            <ZoomIn color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.hudRow}>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setControlRotation(r => r + 20)}>
            <RotateCcw color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.hudLabel}>Spin</Text>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setControlRotation(r => r - 20)}>
            <RotateCw color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.hudRow}>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setControlTilt(t => Math.min(180, t + 10))}>
            <ArrowUp color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.hudLabel}>Tilt</Text>
          <TouchableOpacity style={styles.hudBtn} onPress={() => setControlTilt(t => Math.max(-180, t - 10))}>
            <ArrowDown color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  arView: { flex: 1 },
  header: {
    position: 'absolute', top: 50, left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 10,
  },
  actionsGroup: { flexDirection: 'row', gap: 5 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C63FF',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 2, borderColor: '#A855F7',
    shadowColor: '#4C1D95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6
  },
  lockBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF8C00',
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18, borderWidth: 2, borderColor: '#FFD93D',
    shadowColor: '#B85E00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6
  },
  lockBtnActive: { backgroundColor: '#E63946', borderColor: '#FF6B6B', shadowColor: '#9D003F' },
  backTxt: { color: '#fff', marginLeft: 5, fontSize: 13, fontWeight: '900' },

  langPickerCard: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(13, 0, 31, 0.96)',
    borderWidth: 2,
    borderColor: '#4A0099',
    zIndex: 20,
  },
  langPickerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  langPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  langBtn: {
    backgroundColor: '#00BFFF',
    borderWidth: 2,
    borderColor: '#43E8D8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  langBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  langCancelBtn: {
    alignSelf: 'center',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  langCancelText: {
    color: '#FFD93D',
    fontSize: 14,
    fontWeight: '800',
  },

  hudContainer: {
    position: 'absolute', bottom: 40, left: 20, right: 20,
    backgroundColor: 'rgba(13, 0, 31, 0.85)', borderRadius: 28, padding: 20, gap: 16,
    borderWidth: 2, borderColor: '#4A0099',
  },
  hudRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  hudBtn: {
    backgroundColor: '#00BFFF', padding: 14, borderRadius: 20,
    width: 64, alignItems: 'center', borderWidth: 2, borderColor: '#43E8D8',
    shadowColor: '#005599', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4
  },
  hudLabel: {
    color: '#FFD93D', fontSize: 16, fontWeight: '900', width: 60, textAlign: 'center'
  }
});
