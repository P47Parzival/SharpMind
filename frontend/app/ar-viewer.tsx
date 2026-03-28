import React, { useState } from 'react';
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
import { ArrowLeft, Lock, Unlock, RotateCcw, RotateCw, ZoomIn, ZoomOut, Moon, Sun, ArrowUp, ArrowDown } from 'lucide-react-native';

const HeartSceneAR = (props: any) => {
  const { isLocked, controlRotation, controlTilt, controlScale, modelSource, isBlackout } = props.sceneNavigator.viroAppProps;

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
          type="GLB"
        />
      </ViroNode>
    </ViroARScene>
  );
};

export default function ARViewerScreen() {
  const router = useRouter();
  const { model } = useLocalSearchParams();

  // Select matching GLB. Defaults to Heart if nothing passed or unknown id is received.
  const modelKey = typeof model === 'string' ? model : 'heart';
  const modelSourceMap: Record<string, any> = {
    heart: require("../glbfiles/realistic_human_heart.glb"),
    body: require("../glbfiles/upper_body_anatomy.glb"),
    'full-body': require("../glbfiles/male_full_body_ecorche.glb"),
    earth: require("../glbfiles/earth.glb"),
  };
  const modelSource = modelSourceMap[modelKey] ?? modelSourceMap.heart;

  const [isLocked, setIsLocked] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [controlRotation, setControlRotation] = useState(0);
  const [controlTilt, setControlTilt] = useState(0);
  const [controlScale, setControlScale] = useState(1);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          // @ts-ignore
          scene: HeartSceneAR,
        }}
        viroAppProps={{ isLocked, controlRotation, controlTilt, controlScale, modelSource, isBlackout }}
        style={styles.arView}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
          <Text style={styles.backTxt}>Exit</Text>
        </TouchableOpacity>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={[styles.lockBtn, isBlackout && styles.lockBtnActive]}
            onPress={() => setIsBlackout(!isBlackout)}
          >
            {isBlackout ? <Moon color="#fff" size={20} /> : <Sun color="#fff" size={20} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.lockBtn, isLocked && styles.lockBtnActive]}
            onPress={() => setIsLocked(!isLocked)}
          >
            {isLocked ? <Lock color="#fff" size={20} /> : <Unlock color="#fff" size={20} />}
            <Text style={styles.backTxt}>{isLocked ? 'Locked' : 'Unlocked'}</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 10,
  },
  actionsGroup: { flexDirection: 'row', gap: 8 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C63FF',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 2, borderColor: '#A855F7',
    shadowColor: '#4C1D95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6
  },
  lockBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF8C00',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 2, borderColor: '#FFD93D',
    shadowColor: '#B85E00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6
  },
  lockBtnActive: { backgroundColor: '#E63946', borderColor: '#FF6B6B', shadowColor: '#9D003F' },
  backTxt: { color: '#fff', marginLeft: 8, fontSize: 16, fontWeight: '900' },

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
