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

// Fixed layout constants — sized for 375px iPhone, no dynamic scaling
const BODY_W = 120;
const HALF_SPAN = 155;   // inner arc rx: dome spans 310px of the 375px screen
const INNER_RY  = 175;   // inner arc ry (taller than rx for a tall arch look)
const OUTER_RX  = 171;   // outer arc rx (+16)
const OUTER_RY  = 195;   // outer arc ry (+20)
const SVG_W = OUTER_RX * 2 + 8;  // 350
const SVG_H = OUTER_RY + 6;      // 201

// Approximate height of flags + fortress body that must fit inside the dome
const CONTENT_H = 18 + 4 + 46 * 2 + 4 + 16 + 6;  // flag + gap + cells + gap + pad + border = 140

// Negative marginTop pulls fortress content up so arc base aligns with content bottom
const DOME_OVERLAP = -(CONTENT_H + 2); // -142

function ShieldDome({ shields }: { shields: number }) {
  const cx = SVG_W / 2;
  const y  = SVG_H - 2;  // arc base sits at the very bottom of the SVG

  const arcs = shields >= 2
    ? [{ rx: HALF_SPAN, ry: INNER_RY }, { rx: OUTER_RX, ry: OUTER_RY }]
    : [{ rx: HALF_SPAN, ry: INNER_RY }];

  return (
    <Svg width={SVG_W} height={SVG_H}>
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
  return (
    <View style={[styles.container, isOpponent && styles.flipped]}>
      {label && <Text style={[styles.label, isOpponent && styles.flippedText]}>{label}</Text>}

      {/* Shield dome — elliptical arch sized to span nearly the full phone screen */}
      {player.shields > 0 && <ShieldDome shields={player.shields} />}

      {/* Fortress content pulled up into the dome via negative marginTop */}
      <View style={[styles.content, player.shields > 0 && { marginTop: DOME_OVERLAP }]}>

        {/* Flags row — sits inside the dome, above the character grid */}
        <View style={styles.flagRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Text key={i} style={styles.flag}>
              {i < player.flags ? '🚩' : '▪️'}
            </Text>
          ))}
        </View>

        {/* Character grid */}
        <View style={styles.body}>
          <CharacterGrid hp={player.fortressHp} />
        </View>

        {/* Drawn weapon — rendered inside the content block so it stays in front of dome */}
        {player.hasWeapon && (
          <View style={styles.weaponBox}>
            {player.weaponDrawing ? (
              <Svg
                width={90}
                height={55}
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
    borderRadius: 6,
    padding: 4,
    backgroundColor: colors.white,
  },
  weaponEmoji: { fontSize: 20 },
  hint: { fontSize: 10, color: colors.gray, marginTop: 2 },
});
