import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FORTRESS_CHARS } from '@tinhataiping/shared';
import { colors } from '../theme/colors';

interface Props {
  hp: number; // 0–4 characters remaining
  flipped?: boolean;
}

export function CharacterGrid({ hp, flipped }: Props) {
  // Characters displayed: 天下 / 太平 (2x2 grid)
  // Remove characters from right to left: 平 first, then 太, 下, 天
  const chars = FORTRESS_CHARS; // ['天','下','太','平']

  return (
    <View style={[styles.grid, flipped && styles.flipped]}>
      {/* Row 1: 天 下 */}
      <View style={styles.row}>
        {[0, 1].map((i) => (
          <CharCell key={i} char={chars[i]} active={i < hp} />
        ))}
      </View>
      {/* Row 2: 太 平 */}
      <View style={styles.row}>
        {[2, 3].map((i) => (
          <CharCell key={i} char={chars[i]} active={i < hp} />
        ))}
      </View>
    </View>
  );
}

function CharCell({ char, active }: { char: string; active: boolean }) {
  return (
    <View style={[styles.cell, !active && styles.cellDead]}>
      <Text style={[styles.char, !active && styles.charDead]}>{active ? char : '✕'}</Text>
    </View>
  );
}

const CELL_SIZE = 52;

const styles = StyleSheet.create({
  grid: { flexDirection: 'column', gap: 4 },
  flipped: { transform: [{ rotate: '180deg' }] },
  row: { flexDirection: 'row', gap: 4 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 2,
    borderColor: colors.stoneDark,
    backgroundColor: colors.stoneLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  cellDead: {
    backgroundColor: '#888',
    borderColor: '#555',
  },
  char: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.inkBlack,
  },
  charDead: {
    color: '#444',
    fontSize: 20,
  },
});
