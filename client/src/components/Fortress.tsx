import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { PlayerState } from '@tinhataiping/shared';
import { CharacterGrid } from './CharacterGrid';
import { colors } from '../theme/colors';

interface Props {
  player: PlayerState;
  isOpponent?: boolean;
  label?: string;
}

const FORTRESS_WIDTH = 140;
const SHIELD_BASE_RADIUS = 84;
const SHIELD_GAP = 14;

// Draws a semicircle arc above the fortress
function ShieldArcs({ shields }: { shields: number }) {
  if (shields === 0) return null;
  const cx = FORTRESS_WIDTH / 2;
  const svgHeight = SHIELD_BASE_RADIUS + SHIELD_GAP * (shields - 1) + 10;

  const arcs = Array.from({ length: shields }, (_, i) => {
    const r = SHIELD_BASE_RADIUS + i * SHIELD_GAP;
    const x1 = cx - r;
    const x2 = cx + r;
    const y = svgHeight - 6;
    // SVG arc: move to left, arc to right (top half = sweep-flag 0)
    return `M ${x1},${y} A ${r},${r} 0 0,1 ${x2},${y}`;
  });

  return (
    <Svg width={FORTRESS_WIDTH} height={svgHeight} style={styles.shieldSvg}>
      {arcs.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={colors.shieldBlue}
          strokeWidth={3 + i}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

export function Fortress({ player, isOpponent, label }: Props) {
  return (
    <View style={[styles.container, isOpponent && styles.flipped]}>
      {label && <Text style={[styles.label, isOpponent && styles.flippedText]}>{label}</Text>}

      {/* Shield arcs sit above the fortress body */}
      <ShieldArcs shields={player.shields} />

      {/* Fortress body */}
      <View style={styles.body}>
        <CharacterGrid hp={player.fortressHp} />
      </View>

      {/* Flags row */}
      <View style={styles.flagRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Text key={i} style={styles.flag}>
            {i < player.flags ? '🚩' : '▪️'}
          </Text>
        ))}
      </View>

      {/* Drawn weapon */}
      {player.hasWeapon && (
        <View style={styles.weaponBox}>
          {player.weaponDrawing ? (
            <Svg width={60} height={40}>
              <Path
                d={player.weaponDrawing}
                stroke={colors.inkBlack}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <Text style={styles.weaponText}>⚔️</Text>
          )}
        </View>
      )}

      {/* Build phase hint */}
      <Text style={[styles.hint, isOpponent && styles.flippedText]}>
        {getBuildHint(player)}
      </Text>
    </View>
  );
}

function getBuildHint(p: PlayerState): string {
  if (p.fortressHp === 0) return '❌';
  if (p.flags < 3) return `Flags ${p.flags}/3`;
  if (p.shields < 2) return `Shields ${p.shields}/2`;
  if (!p.hasWeapon) return 'Draw weapon!';
  return '⚔️ Attacking';
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  flipped: { transform: [{ scaleY: -1 }] },
  flippedText: { transform: [{ scaleY: -1 }] },
  label: { fontSize: 12, color: colors.stoneDark, fontWeight: '600' },
  shieldSvg: { marginBottom: -6 },
  body: {
    backgroundColor: colors.stoneMid,
    borderWidth: 3,
    borderColor: colors.stoneDark,
    borderRadius: 8,
    padding: 8,
    width: FORTRESS_WIDTH,
    alignItems: 'center',
  },
  flagRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  flag: { fontSize: 18 },
  weaponBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 6,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  weaponText: { fontSize: 20 },
  hint: { fontSize: 10, color: colors.gray, marginTop: 2 },
});
