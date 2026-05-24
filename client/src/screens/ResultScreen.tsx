import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/gameStore';
import { requestRematch } from '../socket/socketClient';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
};

export function ResultScreen({ navigation }: Props) {
  const { gameState, myPlayerId, roomId, reset } = useGameStore();

  if (!gameState) {
    navigation.replace('Home');
    return null;
  }

  const iWon = gameState.winner === myPlayerId;
  const winnerName =
    gameState.winner === gameState.p1.id ? gameState.p1.name : gameState.p2.name;

  function handleRematch() {
    if (roomId) requestRematch(roomId);
  }

  function handleHome() {
    reset();
    navigation.replace('Home');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Result banner */}
        <View style={styles.banner}>
          <Text style={styles.trophy}>{iWon ? '🏆' : '💀'}</Text>
          <Text style={styles.resultText}>
            {iWon ? 'You Win!' : `${winnerName} Wins!`}
          </Text>
          <Text style={styles.resultCn}>{iWon ? '勝利！' : '失敗'}</Text>
        </View>

        {/* Round history */}
        <Text style={styles.historyTitle}>Round History 對局記錄</Text>
        <View style={styles.history}>
          {gameState.roundHistory.map((r) => (
            <View key={r.round} style={styles.historyRow}>
              <Text style={styles.historyRound}>R{r.round}</Text>
              <Text style={styles.historyGestures}>
                {gestureEmoji(r.p1Gesture)} vs {gestureEmoji(r.p2Gesture)}
              </Text>
              <Text style={styles.historyOutcome}>
                {r.outcome === 'draw' ? '🤝' : r.outcome === 'p1_wins' ? '← P1' : 'P2 →'}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {roomId && (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleRematch}>
              <Text style={styles.btnText}>🔄 Rematch 再來一局</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleHome}>
            <Text style={styles.btnText}>🏠 Home 主頁</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function gestureEmoji(g: string): string {
  return g === 'rock' ? '✊' : g === 'paper' ? '🖐' : '✌️';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperBg },
  container: { padding: 24, gap: 20, alignItems: 'center' },
  banner: { alignItems: 'center', gap: 8 },
  trophy: { fontSize: 64 },
  resultText: { fontSize: 28, fontWeight: 'bold', color: colors.inkBlack },
  resultCn: { fontSize: 18, color: colors.stoneDark },
  historyTitle: { fontSize: 16, fontWeight: '700', color: colors.inkBlack, alignSelf: 'flex-start' },
  history: { width: '100%', gap: 6 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  historyRound: { width: 32, fontSize: 12, color: colors.gray },
  historyGestures: { flex: 1, fontSize: 16, textAlign: 'center' },
  historyOutcome: { fontSize: 12, color: colors.stoneDark, width: 48, textAlign: 'right' },
  actions: { width: '100%', gap: 12 },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.stoneDark,
  },
  btnPrimary: { backgroundColor: colors.buttonWood },
  btnSecondary: { backgroundColor: colors.shieldBlue },
  btnText: { fontSize: 15, fontWeight: 'bold', color: colors.white },
});
