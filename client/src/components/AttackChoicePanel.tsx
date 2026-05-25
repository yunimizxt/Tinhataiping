import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onAttack: () => void;
  onDefense: () => void;
  onWeapon: () => void;
}

export function AttackChoicePanel({ onAttack, onDefense, onWeapon }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚔️ You won! Choose:</Text>
      <TouchableOpacity style={[styles.btn, styles.attackBtn]} onPress={onAttack}>
        <Text style={styles.btnEmoji}>⚔️</Text>
        <Text style={styles.btnText}>Attack</Text>
        <Text style={styles.btnSub}>Hit opponent's outer layer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.defenseBtn]} onPress={onDefense}>
        <Text style={styles.btnEmoji}>🛡</Text>
        <Text style={styles.btnText}>Extra Shield</Text>
        <Text style={styles.btnSub}>Add a bonus defense layer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.weaponBtn]} onPress={onWeapon}>
        <Text style={styles.btnEmoji}>✏️</Text>
        <Text style={styles.btnText}>New Weapon</Text>
        <Text style={styles.btnSub}>Draw a replacement weapon</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.paperBg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.stoneDark,
    padding: 14,
    alignItems: 'stretch',
    gap: 8,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.inkBlack,
    textAlign: 'center',
    marginBottom: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 10,
  },
  attackBtn: { backgroundColor: '#8b1a1a' },
  defenseBtn: { backgroundColor: colors.shieldBlue },
  weaponBtn: { backgroundColor: colors.buttonWood },
  btnEmoji: { fontSize: 22 },
  btnText: { fontSize: 14, fontWeight: 'bold', color: colors.white, flex: 1 },
  btnSub: { fontSize: 10, color: 'rgba(255,255,255,0.75)' },
});
