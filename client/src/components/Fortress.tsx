import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PlayerState } from '@tinhataiping/shared';
import { CharacterGrid } from './CharacterGrid';
import { colors } from '../theme/colors';

interface Props {
  player: PlayerState;
  isOpponent?: boolean;
  label?: string;
}

// Canvas dimensions used in WeaponDrawingCanvas
const DRAW_CANVAS_W = 260;
const DRAW_CANVAS_H = 160;

const BODY_W = 140;
// Shield arcs are wider than the fortress body so they visually wrap around the sides
const SHIELD_INNER_R = 110;   // arc spans 220px wide, extends 40px beyond each side
const SHIELD_OUTER_R = 132;   // arc spans 264px wide

function ShieldDome({ shields }: { shields: number }) {
  if (shields === 0) return null;

  const outerR = shields >= 2 ? SHIELD_OUTER_R : SHIELD_INNER_R;
  // SVG must be wide enough to contain the largest arc
  const svgW = outerR * 2 + 6;
  const svgH = outerR + 6;
  const cx = svgW / 2;
  // Arc flat edge sits at the bottom of the SVG
  const y = svgH - 2;

  return (
    // Negative marginBottom pulls the fortress body up so it sits inside the dome
    <Svg width={svgW} height={svgH} style={styles.domeSvg}>
      {Array.from({ length: shields }, (_, i) => {
        const r = i === 0 ? SHIELD_INNER_R : SHIELD_OUTER_R;
        const x1 = cx - r;
        const x2 = cx + r;
        // Slight fill to make the shield feel like a bubble
        const fillOpacity = i === 0 ? 0.06 : 0.04;
        return (
          <Path
            key={i}
            d={`M ${x1},${y} A ${r},${r} 0 0,1 ${x2},${y}`}
            stroke={colors.shieldBlue}
            strokeWidth={3 + i * 2}
            fill={`rgba(34,85,170,${fillOpacity})`}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

export function Fortress({ player, isOpponent, label }: Props) {
  return (
    <View style={[styles.container, isOpponent && styles.flipped]}>
      {label && <Text style={[styles.label, isOpponent && styles.flippedText]}>{label}</Text>}

      {/* Shield dome — sits above the fortress body, wider than it */}
      <ShieldDome shields={player.shields} />

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

      {/* Drawn weapon — viewBox scales path from drawing canvas to display size */}
      {player.hasWeapon && (
        <View style={styles.weaponBox}>
          {player.weaponDrawing ? (
            <Svg
              width={80}
              height={50}
              viewBox={`0 0 ${DRAW_CANVAS_W} ${DRAW_CANVAS_H}`}
            >
              <Path
                d={player.weaponDrawing}
                stroke={colors.inkBlack}
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <Text style={styles.weaponEmoji}>⚔️</Text>
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
  container: { alignItems: 'center', gap: 0 },
  flipped: { transform: [{ scaleY: -1 }] },
  flippedText: { transform: [{ scaleY: -1 }] },
  label: { fontSize: 12, color: colors.stoneDark, fontWeight: '600', marginBottom: 2 },
  // Pull the fortress body upward so it sits just inside the dome's open bottom
  domeSvg: { marginBottom: -18 },
  body: {
    backgroundColor: colors.stoneMid,
    borderWidth: 3,
    borderColor: colors.stoneDark,
    borderRadius: 8,
    padding: 8,
    width: BODY_W,
    alignItems: 'center',
  },
  flagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  flag: { fontSize: 18 },
  weaponBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 6,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  weaponEmoji: { fontSize: 20 },
  hint: { fontSize: 10, color: colors.gray, marginTop: 2 },
});
