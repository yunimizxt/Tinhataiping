import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  durationMs: number;
  active: boolean;
  onExpire?: () => void;
}

export function TurnTimer({ durationMs, active, onExpire }: Props) {
  const [remaining, setRemaining] = useState(durationMs);
  const startTime = useRef<number | null>(null);
  const animWidth = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      setRemaining(durationMs);
      animWidth.setValue(1);
      return;
    }

    startTime.current = Date.now();
    setRemaining(durationMs);

    Animated.timing(animWidth, {
      toValue: 0,
      duration: durationMs,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      const elapsed = Date.now() - (startTime.current ?? Date.now());
      const rem = Math.max(0, durationMs - elapsed);
      setRemaining(rem);
      if (rem === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [active, durationMs]);

  const secs = Math.ceil(remaining / 1000);
  const isUrgent = remaining < 3000;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.bar,
            isUrgent && styles.barUrgent,
            { width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <Text style={[styles.text, isUrgent && styles.textUrgent]}>{secs}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: colors.shieldBlue,
    borderRadius: 4,
  },
  barUrgent: { backgroundColor: colors.accentRed },
  text: { fontSize: 12, color: colors.stoneDark, width: 24, textAlign: 'right' },
  textUrgent: { color: colors.accentRed, fontWeight: 'bold' },
});
