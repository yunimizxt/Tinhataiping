import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AttackTarget } from '@tinhataiping/shared';
import { colors } from '../theme/colors';

interface Props {
  options: AttackTarget[];
  onSelect: (t: AttackTarget) => void;
  isMyChoice: boolean;
}

const TARGET_LABELS: Record<AttackTarget, { emoji: string; label: string; cn: string }> = {
  base: { emoji: '🏰', label: 'Attack Base', cn: '攻擊基地' },
  cannon: { emoji: '💣', label: 'Destroy Cannon', cn: '摧毀大炮' },
  aircraft: { emoji: '✈️', label: 'Destroy Aircraft', cn: '摧毀飛機' },
};

export function AttackChoicePanel({ options, onSelect, isMyChoice }: Props) {
  if (!isMyChoice) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.waitText}>⚔️ Opponent is choosing attack target...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚔️ Choose your target! 選擇目標</Text>
      <View style={styles.row}>
        {options.map((target) => {
          const { emoji, label, cn } = TARGET_LABELS[target];
          return (
            <TouchableOpacity
              key={target}
              style={styles.btn}
              onPress={() => onSelect(target)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.cn}>{cn}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  title: { fontSize: 13, color: colors.accentRed, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.accentRed,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.stoneDark,
    gap: 2,
    minWidth: 100,
  },
  emoji: { fontSize: 28 },
  label: { fontSize: 12, color: colors.white, fontWeight: '600' },
  cn: { fontSize: 11, color: colors.white },
  waiting: { padding: 16, alignItems: 'center' },
  waitText: { fontSize: 14, color: colors.stoneDark, fontStyle: 'italic' },
});
