import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture } from '@tinhataiping/shared';
import { colors } from '../theme/colors';

interface Props {
  onSelect: (g: Gesture) => void;
  selected: Gesture | null;
  disabled?: boolean;
}

const GESTURES: { key: Gesture; emoji: string; label: string; cn: string }[] = [
  { key: 'rock', emoji: '✊', label: 'Rock', cn: '石頭' },
  { key: 'paper', emoji: '🖐', label: 'Paper', cn: '布' },
  { key: 'scissors', emoji: '✌️', label: 'Scissors', cn: '剪刀' },
];

export function GesturePanel({ onSelect, selected, disabled }: Props) {
  const { width: screenW } = useWindowDimensions();
  // 3 buttons + 2 gaps (12px each) + container padding (32px total)
  const btnW = Math.min(96, Math.floor((screenW - 56) / 3));
  const emojiFontSize = Math.round(btnW * 0.33);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your gesture 猜拳</Text>
      <View style={styles.row}>
        {GESTURES.map(({ key, emoji, label, cn }) => {
          const isSelected = selected === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.btn, isSelected && styles.btnSelected, disabled && styles.btnDisabled, { width: btnW }]}
              onPress={() => !disabled && onSelect(key)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: emojiFontSize }}>{emoji}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
              <Text style={[styles.cn, isSelected && styles.labelSelected]}>{cn}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  title: { fontSize: 13, color: colors.stoneDark, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  btn: {
    width: 90,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.buttonWood,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.stoneDark,
    gap: 2,
  },
  btnSelected: {
    backgroundColor: colors.buttonActive,
    borderColor: colors.accentGold,
    borderWidth: 3,
  },
  btnDisabled: { opacity: 0.5 },
  label: { fontSize: 12, color: colors.buttonText, fontWeight: '600' },
  cn: { fontSize: 11, color: colors.buttonText },
  labelSelected: { color: colors.inkBlack },
});
