import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, PanResponder, Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';

interface Props {
  playerName: string;
  onDone: (pathData: string) => void;
  onSkip: () => void;
}

const CANVAS_W = 260;
const CANVAS_H = 160;

export function WeaponDrawingCanvas({ playerName, onDone, onSkip }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>('');
  const isDrawing = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentPath.current = `M ${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        isDrawing.current = true;
        setPaths((prev) => [...prev, currentPath.current]);
      },

      onPanResponderMove: (e) => {
        if (!isDrawing.current) return;
        const { locationX, locationY } = e.nativeEvent;
        currentPath.current += ` L ${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setPaths((prev) => [...prev.slice(0, -1), currentPath.current]);
      },

      onPanResponderRelease: () => {
        isDrawing.current = false;
      },
    })
  ).current;

  function handleClear() {
    setPaths([]);
    currentPath.current = '';
  }

  function handleDone() {
    const combined = paths.join(' ');
    onDone(combined || 'M 0,0');
  }

  const allPathData = paths.join(' ');

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>⚔️ Draw Your Weapon!</Text>
        <Text style={styles.subtitle}>{playerName} — draw a cannon, plane, or anything!</Text>

        {/* Drawing canvas */}
        <View
          style={styles.canvas}
          {...panResponder.panHandlers}
        >
          <Svg width={CANVAS_W} height={CANVAS_H}>
            {paths.map((d, i) => (
              <Path
                key={i}
                d={d}
                stroke={colors.inkBlack}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
          {paths.length === 0 && (
            <Text style={styles.placeholder}>Draw here ✏️</Text>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.doneBtn, paths.length === 0 && styles.disabledBtn]}
            onPress={handleDone}
            disabled={paths.length === 0}
          >
            <Text style={styles.doneText}>Done ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: colors.paperBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    width: CANVAS_W + 40,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.inkBlack },
  subtitle: { fontSize: 12, color: colors.stoneDark, textAlign: 'center' },
  canvas: {
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.stoneDark,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    position: 'absolute',
    fontSize: 16,
    color: colors.lightGray,
  },
  buttons: { flexDirection: 'row', gap: 10 },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  clearText: { fontSize: 14, color: colors.gray },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.stoneDark,
  },
  skipText: { fontSize: 14, color: colors.stoneDark },
  doneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.buttonWood,
  },
  disabledBtn: { opacity: 0.4 },
  doneText: { fontSize: 14, fontWeight: 'bold', color: colors.white },
});
