import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <View style={styles.titleGrid}>
            {['天', '下', '太', '平'].map((char) => (
              <View key={char} style={styles.titleCell}>
                <Text style={styles.titleChar}>{char}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.subtitle}>Tin Ha Tai Ping — Peaceful War</Text>
          <Text style={styles.description}>
            The classic Hong Kong fortress game{'\n'}rebuilt for mobile
          </Text>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          <MenuButton
            label="Online Game"
            cn="網上對戰"
            emoji="🌐"
            onPress={() => navigation.navigate('Lobby')}
          />
          <MenuButton
            label="Local 2-Player"
            cn="本地雙人"
            emoji="👥"
            onPress={() => navigation.navigate('LocalGame')}
          />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>How to win:</Text>
          <Text style={styles.legendText}>✊ Rock beats ✌️ Scissors</Text>
          <Text style={styles.legendText}>✌️ Scissors beats 🖐 Paper</Text>
          <Text style={styles.legendText}>🖐 Paper beats ✊ Rock</Text>
          <Text style={styles.legendNote}>Build flags → shields → weapons → attack!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function MenuButton({
  label, cn, emoji, onPress,
}: { label: string; cn: string; emoji: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuCn}>{cn}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperBg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', padding: 24 },

  titleBlock: { alignItems: 'center', gap: 10 },
  titleGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 140, gap: 4 },
  titleCell: {
    width: 64,
    height: 64,
    backgroundColor: colors.stoneMid,
    borderWidth: 3,
    borderColor: colors.stoneDark,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleChar: { fontSize: 34, fontWeight: 'bold', color: colors.inkBlack },
  subtitle: { fontSize: 14, color: colors.stoneDark, fontWeight: '600' },
  description: { fontSize: 12, color: colors.gray, textAlign: 'center' },

  menu: { gap: 14, width: '100%' },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.buttonWood,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: colors.stoneDark,
  },
  menuEmoji: { fontSize: 32 },
  menuLabel: { fontSize: 16, fontWeight: 'bold', color: colors.buttonText },
  menuCn: { fontSize: 12, color: colors.stoneLight },

  legend: {
    gap: 3,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  legendTitle: { fontSize: 13, fontWeight: 'bold', color: colors.inkBlack, marginBottom: 4 },
  legendText: { fontSize: 12, color: colors.inkBlack },
  legendNote: { fontSize: 11, color: colors.stoneDark, marginTop: 4, fontStyle: 'italic' },
});
