import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
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

interface DomeProps {
  shields: number;
  halfSpan: number; // rx of inner arc (half of arc span)
}

function ShieldDome({ shields, halfSpan }: DomeProps) {
  // Elliptical arcs: taller than wide so the arch rises dramatically above the fortress
  const innerRx = halfSpan;
  const innerRy = Math.round(halfSpan * 1.2);
  const outerRx = halfSpan + 16;
  const outerRy = innerRy + 20;

  const arcs = shields >= 2
    ? [{ rx: innerRx, ry: innerRy }, { rx: outerRx, ry: outerRy }]
    : [{ rx: innerRx, ry: innerRy }];

  const maxRx = arcs[arcs.length - 1].rx;
  const maxRy = arcs[arcs.length - 1].ry;
  const svgW = maxRx * 2 + 8;
  const svgH = maxRy + 6;
  const cx = svgW / 2;
  const y = svgH - 2; // arc endpoints sit at the very bottom of the SVG

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
  const { width: screenW, height: screenH } = useWindowDimensions();
  const scale = Math.min(screenW / 375, screenH / 812, 1.25);

  const bodyW = Math.round(130 * scale);
  const flagSize = Math.round(18 * scale);
  const cellSize = Math.round(52 * scale);

  // Dome: half-span based on screen width so it always fills nearly the full width
  const halfSpan = Math.round(screenW * 0.44);

  // Content height: flag row + gap + fortress body (2 cell rows + padding + border)
  const contentH = Math.round(flagSize + 4 + cellSize * 2 + 4 + 16 + 6);

  // Pull content up so its bottom aligns with the dome's arc base
  const domeOverlap = -(contentH + 2);

  return (
    <View style={[styles.container, isOpponent && styles.flipped]}>
      {label && <Text style={[styles.label, isOpponent && styles.flippedText]}>{label}</Text>}

      {/* Shield dome — drawn first; negative marginTop on content pulls it up inside */}
      {player.shields > 0 && (
        <ShieldDome shields={player.shields} halfSpan={halfSpan} />
      )}

      {/* Fortress content: flags on top, grid below — both sit inside the dome */}
      <View style={[
        styles.fortressContent,
        player.shields > 0 && { marginTop: domeOverlap },
      ]}>
        <View style={styles.flagRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Text key={i} style={{ fontSize: flagSize }}>
              {i < player.flags ? '🚩' : '▪️'}
            </Text>
          ))}
        </View>

        <View style={[styles.body, { width: bodyW }]}>
          <CharacterGrid hp={player.fortressHp} scale={scale} />
        </View>
      </View>

      {/* Drawn weapon — viewBox scales path from 260×160 canvas to display size */}
      {player.hasWeapon && (
        <View style={styles.weaponBox}>
          {player.weaponDrawing ? (
            <Svg
              width={Math.round(80 * scale)}
              height={Math.round(50 * scale)}
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
            <Text style={{ fontSize: Math.round(20 * scale) }}>⚔️</Text>
          )}
        </View>
      )}

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
  container: { alignItems: 'center' },
  flipped: { transform: [{ scaleY: -1 }] },
  flippedText: { transform: [{ scaleY: -1 }] },
  label: { fontSize: 12, color: colors.stoneDark, fontWeight: '600', marginBottom: 2 },
  fortressContent: { alignItems: 'center', gap: 4 },
  flagRow: { flexDirection: 'row', gap: 6 },
  body: {
    backgroundColor: colors.stoneMid,
    borderWidth: 3,
    borderColor: colors.stoneDark,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  weaponBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 6,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  hint: { fontSize: 10, color: colors.gray, marginTop: 2 },
});
