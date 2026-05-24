import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FORTRESS_CHARS } from '@tinhataiping/shared';
import { colors } from '../theme/colors';

interface Props {
  hp: number; // 0–4 characters remaining
  scale?: number;
}

export function CharacterGrid({ hp, scale = 1 }: Props) {
  const chars = FORTRESS_CHARS; // ['天','下','太','平']
  const cellSize = Math.round(52 * scale);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        {[0, 1].map((i) => <CharCell key={i} char={chars[i]} active={i < hp} cellSize={cellSize} />)}
      </View>
      <View style={styles.row}>
        {[2, 3].map((i) => <CharCell key={i} char={chars[i]} active={i < hp} cellSize={cellSize} />)}
      </View>
    </View>
  );
}

function CharCell({ char, active, cellSize }: { char: string; active: boolean; cellSize: number }) {
  return (
    <View style={[
      styles.cell,
      !active && styles.cellDamaged,
      { width: cellSize, height: cellSize },
    ]}>
      {/* Always show the character — faded when damaged so it's clear it can be repaired */}
      <Text style={[styles.char, !active && styles.charDamaged, { fontSize: Math.round(cellSize * 0.54) }]}>
        {char}
      </Text>
      {/* Crack overlay on damaged cells */}
      {!active && <Text style={[styles.crack, { fontSize: Math.round(cellSize * 0.5) }]}>✕</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'column', gap: 4 },
  row: { flexDirection: 'row', gap: 4 },
  cell: {
    borderWidth: 2,
    borderColor: colors.stoneDark,
    backgroundColor: colors.stoneLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  cellDamaged: {
    backgroundColor: '#c0a080',
    borderColor: '#7a5a3a',
    borderStyle: 'dashed',
  },
  char: {
    fontWeight: 'bold',
    color: colors.inkBlack,
  },
  charDamaged: {
    color: 'rgba(80,50,20,0.25)',
  },
  crack: {
    position: 'absolute',
    color: 'rgba(150,50,30,0.55)',
    fontWeight: 'bold',
  },
});
