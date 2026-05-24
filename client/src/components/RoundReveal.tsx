import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoundResult } from '@tinhataiping/shared';
import { colors } from '../theme/colors';

interface Props {
  result: RoundResult;
  myPlayerId: string;
}

const GESTURE_EMOJI: Record<string, string> = {
  rock: '✊',
  paper: '🖐',
  scissors: '✌️',
};

export function RoundReveal({ result, myPlayerId }: Props) {
  const { p1Gesture, p2Gesture, outcome, p1Progress, p2Progress } = result;

  const outcomeLabel =
    outcome === 'draw' ? '🤝 Draw!' :
    outcome === 'p1_wins' ? 'P1 wins the round!' : 'P2 wins the round!';

  return (
    <View style={styles.container}>
      <View style={styles.gestures}>
        <View style={styles.side}>
          <Text style={styles.emoji}>{GESTURE_EMOJI[p1Gesture]}</Text>
          <Text style={styles.playerLabel}>P1</Text>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={styles.side}>
          <Text style={styles.emoji}>{GESTURE_EMOJI[p2Gesture]}</Text>
          <Text style={styles.playerLabel}>P2</Text>
        </View>
      </View>
      <Text style={styles.outcome}>{outcomeLabel}</Text>
      {p1Progress && <Text style={styles.progress}>P1: {formatProgress(p1Progress)}</Text>}
      {p2Progress && <Text style={styles.progress}>P2: {formatProgress(p2Progress)}</Text>}
    </View>
  );
}

function formatProgress(p: RoundResult['p1Progress']): string {
  if (!p) return '';
  switch (p.type) {
    case 'built_flag':      return '🚩 Built a flag';
    case 'built_shield':    return '🛡 Built a shield';
    case 'built_weapon':    return '⚔️ Built a weapon!';
    case 'repaired_flag':   return '🔧 Repaired flag';
    case 'repaired_shield':   return '🔧 Repaired shield';
    case 'repaired_fortress': return '🔧 Repaired fortress';
    case 'attacked':          return `💥 Hit ${p.hit}!`;
    default: return '';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(245,240,232,0.95)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.stoneDark,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
  },
  gestures: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  side: { alignItems: 'center', gap: 2 },
  emoji: { fontSize: 40 },
  playerLabel: { fontSize: 11, color: colors.stoneDark, fontWeight: '600' },
  vs: { fontSize: 18, fontWeight: 'bold', color: colors.stoneDark },
  outcome: { fontSize: 16, fontWeight: 'bold', color: colors.inkBlack },
  progress: { fontSize: 12, color: colors.stoneDark },
});
