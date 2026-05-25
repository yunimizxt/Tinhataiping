import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PlayerState } from '@tinhataiping/shared';
import { CharacterGrid } from './CharacterGrid';
import { DRAW_CANVAS_W, DRAW_CANVAS_H } from './WeaponDrawingCanvas';
import { colors } from '../theme/colors';

interface Props {
  player: PlayerState;
  isOpponent?: boolean;
  label?: string;
}

// Fixed layout constants sized for 375px iPhone
const BODY_W = 120;

// Shield dome arc sizes (elliptical arcs: taller than wide)
const ARC_PARAMS = [
  { rx: 155, ry: 175 }, // 1 shield
  { rx: 171, ry: 195 }, // 2 shields
  { rx: 185, ry: 213 }, // 3 shields (extra defense bonus)
];

// Content height: flag row + gap + fortress body (2 cells + gap + padding + border)
const CONTENT_H = 18 + 4 + 46 * 2 + 4 + 16 + 6; // = 140

function ShieldDome({ shields }: { shields: number }) {
  const numArcs = Math.min(shields, ARC_PARAMS.length);
  const arcs = ARC_PARAMS.slice(0, numArcs);
  const { rx: maxRx, ry: maxRy } = arcs[arcs.length - 1];

  const svgW = maxRx * 2 + 8;
  const svgH = maxRy + 6;
  const cx = svgW / 2;
  const y  = svgH - 2; // arc endpoints at the very bottom of the SVG

  return (
    <Svg width={svgW} height={svgH}>
      {arcs.map(({ rx, ry }, i) => (
        <Path
          key={i}
          d={`M ${cx - rx},${y} A ${rx},${ry} 0 0,1 ${cx + rx},${y}`}
          stroke={colors.shieldBlue}
          strokeWidth={3 + i * 2}
          fill={`rgba(34,85,170,${i === 0 ? 0.07 : 0.04})`}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

export function Fortress({ player, isOpponent, label }: Props) {
  // Negative marginTop: pulls content UP so its bottom aligns with the dome's arc base
  const domeOverlap = -(CONTENT_H + 2);

  return (
    <View style={[styles.wrapper, isOpponent && styles.flipped]}>
      {label && <Text style={[styles.label, isOpponent && styles.flippedText]}>{label}</Text>}

      {/* Row: [weapon slot left] [fortress center] [weapon display right] */}
      <View style={styles.row}>

        {/* Left spacer keeps fortress centered when weapon is shown */}
        <View style={styles.weaponSlot} />

        {/* Fortress center: dome arches over flags + grid */}
        <View style={styles.fortressCenter}>
          {player.shields > 0 && <ShieldDome shields={player.shields} />}

          <View style={[
            styles.content,
            player.shields > 0 && { marginTop: domeOverlap },
          ]}>
            <View style={styles.flagRow}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Text key={i} style={styles.flag}>
                  {i < player.flags ? '🚩' : '▪️'}
                </Text>
              ))}
            </View>
            <View style={styles.body}>
              <CharacterGrid hp={player.fortressHp} />
            </View>
          </View>
        </View>

        {/* Weapon display — outside the dome, in front of it, to the right */}
        <View style={styles.weaponSlot}>
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
        </View>

      </View>

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
  wrapper: { alignItems: 'center' },
  flipped: { transform: [{ scaleY: -1 }] },
  flippedText: { transform: [{ scaleY: -1 }] },
  label: { fontSize: 12, color: colors.stoneDark, fontWeight: '600', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  weaponSlot: { width: 94, alignItems: 'flex-start', justifyContent: 'flex-end' },
  fortressCenter: { alignItems: 'center' },
  content: { alignItems: 'center', gap: 4 },
  flagRow: { flexDirection: 'row', gap: 6 },
  flag: { fontSize: 18 },
  body: {
    backgroundColor: colors.stoneMid,
    borderWidth: 3,
    borderColor: colors.stoneDark,
    borderRadius: 8,
    padding: 8,
    width: BODY_W,
    alignItems: 'center',
  },
  weaponBox: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 4,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  weaponEmoji: { fontSize: 22, padding: 4 },
  hint: { fontSize: 10, color: colors.gray, marginTop: 2 },
});
