import React, { useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';

interface JoystickProps {
  /**
   * We pass a MutableRefObject so the parent can read the latest dx/dz
   * without triggering React renders.
   */
  valueRef: React.MutableRefObject<{ dx: number; dz: number }>;
}

const SIZE = 140;
const KNOB = 56;
const MAX_OFFSET = (SIZE - KNOB) / 2;
// The value we write to the ref (e.g. at full tilt, output is [-0.08, 0.08])
const OUTPUT_SCALE = 0.08;

export default function Joystick({ valueRef }: JoystickProps) {
  // Visual position of the knob
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;

    const dist = Math.sqrt(translationX ** 2 + translationY ** 2);
    const clampedDist = Math.min(dist, MAX_OFFSET);
    const angle = Math.atan2(translationY, translationX);

    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;

    // Update visual knob
    pan.setValue({ x, y });

    // Write to ref (y maps to dz)
    valueRef.current.dx = (x / MAX_OFFSET) * OUTPUT_SCALE;
    valueRef.current.dz = (y / MAX_OFFSET) * OUTPUT_SCALE;
  };

  const onHandlerStateChange = (event: { nativeEvent: { state: State } }) => {
    if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED ||
      event.nativeEvent.state === State.FAILED
    ) {
      // Spring back to center
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
        bounciness: 12,
        speed: 20,
      }).start();

      valueRef.current.dx = 0;
      valueRef.current.dz = 0;
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={styles.base}>
          <Animated.View
            style={[
              styles.knob,
              { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
            ]}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    zIndex: 100,
  },
  base: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(6,8,37,0.7)',
    borderWidth: 2,
    borderColor: 'rgba(67,232,216,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#43E8D8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: 'rgba(67,232,216,0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#43E8D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
});
