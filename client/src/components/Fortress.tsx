import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerState } from '@tinhataiping/shared';
import { CharacterGrid } from './CharacterGrid';
import { colors } from '../theme/colors';

interface Props {
  player: PlayerState;
  isOpponent?: boolean;
  label?: string;
}

export function Fortress({ player, isOpponent, label }: Props) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.castle}>
        {/* Shield rings (drawn as colored borders) */}
        <View style={[
          styles.shieldWrap,
          player.shields >= 2 && styles.shield2,
          player.shields >= 1 && styles.shield1,
        ]}>
          {/* Fortress body */}
          <View style={styles.body}>
            <CharacterGrid hp={player.fortressHp} flipped={isOpponent} />
          </View>
        </View>

        {/* Flags row */}
        <View style={styles.flagRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={[styles.flag, i < player.flags && styles.flagActive]}>
              <Text style={styles.flagText}>{i < player.flags ? '🚩' : '  '}</Text>
            </View>
          ))}
        </View>

        {/* Weapons */}
        {(player.hasCannon || player.hasAircraft) && (
          <View style={styles.weapons}>
            {player.hasCannon && <Text style={styles.weapon}>💣</Text>}
            {player.hasAircraft && <Text style={styles.weapon}>✈️</Text>}
          </View>
        )}
      </View>

      {/* Build phase indicator */}
      <Text style={styles.phaseText}>{getBuildPhaseText(player)}</Text>
    </View>
  );
}

function getBuildPhaseText(p: PlayerState): string {
  if (p.fortressHp === 0) return '❌ Defeated';
  if (p.flags < 3) return `Flags: ${p.flags}/3`;
  if (p.shields < 2) return `Shields: ${p.shields}/2`;
  if (!p.hasCannon) return 'Building cannon...';
  if (!p.hasAircraft) return 'Building aircraft...';
  return '⚔️ Ready to attack!';
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6 },
  label: { fontSize: 12, color: colors.stoneDark, fontWeight: '600' },
  castle: { alignItems: 'center', gap: 4 },
  shieldWrap: {
    borderRadius: 12,
    padding: 6,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  shield1: {
    borderWidth: 3,
    borderColor: colors.shieldBlue,
  },
  shield2: {
    borderWidth: 6,
    borderColor: colors.shieldBlue,
    shadowColor: colors.shieldBlue,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  body: {
    backgroundColor: colors.stoneMid,
    borderWidth: 3,
    borderColor: colors.stoneDark,
    borderRadius: 8,
    padding: 8,
  },
  flagRow: { flexDirection: 'row', gap: 4, marginTop: 2 },
  flag: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 4,
  },
  flagActive: { borderColor: colors.flagRed },
  flagText: { fontSize: 18 },
  weapons: { flexDirection: 'row', gap: 8, marginTop: 2 },
  weapon: { fontSize: 22 },
  phaseText: { fontSize: 11, color: colors.stoneDark, marginTop: 2 },
});
