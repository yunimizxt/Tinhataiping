import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  Gesture, AttackTarget, GameState,
  TURN_TIMEOUT_MS, ATTACK_CHOICE_TIMEOUT_MS,
} from '@tinhataiping/shared';
import { useGameStore } from '../store/gameStore';
import { submitGesture, submitAttackTarget } from '../socket/socketClient';
import { Fortress } from '../components/Fortress';
import { GesturePanel } from '../components/GesturePanel';
import { AttackChoicePanel } from '../components/AttackChoicePanel';
import { RoundReveal } from '../components/RoundReveal';
import { TurnTimer } from '../components/TurnTimer';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

export function GameScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const [localP1Gesture, setLocalP1Gesture] = useState<Gesture | null>(null);
  const [localP2Gesture, setLocalP2Gesture] = useState<Gesture | null>(null);
  const [passPhase, setPassPhase] = useState<'p1' | 'p2' | null>('p1'); // local mode pass-device

  const {
    gameState, myPlayerId, roomId,
    lastRoundResult, pendingAttackOptions,
    setGameState, setLastRoundResult, setPendingAttackOptions,
  } = useGameStore();

  useEffect(() => {
    if (gameState?.phase === 'gameover') {
      navigation.replace('Result');
    }
  }, [gameState?.phase]);

  if (!gameState) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  const isOnline = mode === 'online';
  const myPlayer = isOnline
    ? (gameState.p1.id === myPlayerId ? gameState.p1 : gameState.p2)
    : gameState.p1; // in local mode, p1 always on bottom
  const oppPlayer = isOnline
    ? (gameState.p1.id === myPlayerId ? gameState.p2 : gameState.p1)
    : gameState.p2;

  const myGesture = isOnline ? myPlayer.gesture : localP1Gesture;
  const canChoose = gameState.phase === 'choosing' && !myPlayer.hasChosen;
  const isAttackChoicePhase = gameState.phase === 'attack_choice';
  const isMyAttackChoice = isAttackChoicePhase &&
    gameState.pendingAttackWinnerId === myPlayerId;

  function handleGestureSelect(g: Gesture) {
    if (!canChoose) return;
    if (isOnline && roomId) {
      submitGesture(roomId, g);
    }
  }

  function handleAttackTarget(t: AttackTarget) {
    if (isOnline && roomId) {
      submitAttackTarget(roomId, t);
      setPendingAttackOptions(null);
    }
  }

  const showReveal = gameState.phase === 'resolving' || gameState.phase === 'attack_choice';
  const timerActive = gameState.phase === 'choosing';
  const choiceTimerActive = isAttackChoicePhase && isMyAttackChoice;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Round counter */}
        <Text style={styles.round}>Round {gameState.round}</Text>

        {/* Opponent fortress (top) */}
        <View style={styles.fortressArea}>
          <Fortress player={oppPlayer} isOpponent label={oppPlayer.name || 'Opponent'} />
          {oppPlayer.hasChosen && gameState.phase === 'choosing' && (
            <Text style={styles.chosenBadge}>✓ Chosen</Text>
          )}
        </View>

        {/* Center area: timer + reveal */}
        <View style={styles.center}>
          {timerActive && (
            <TurnTimer durationMs={TURN_TIMEOUT_MS} active={timerActive} />
          )}
          {choiceTimerActive && (
            <TurnTimer durationMs={ATTACK_CHOICE_TIMEOUT_MS} active={choiceTimerActive} />
          )}
          {showReveal && lastRoundResult && (
            <RoundReveal result={lastRoundResult} myPlayerId={myPlayerId ?? ''} />
          )}
        </View>

        {/* My fortress (bottom) */}
        <View style={styles.fortressArea}>
          <Fortress player={myPlayer} label={myPlayer.name || 'You'} />
          {myPlayer.hasChosen && gameState.phase === 'choosing' && (
            <Text style={styles.chosenBadge}>✓ Chosen</Text>
          )}
        </View>

        {/* Action area */}
        <View style={styles.actionArea}>
          {isAttackChoicePhase && pendingAttackOptions ? (
            <AttackChoicePanel
              options={pendingAttackOptions}
              onSelect={handleAttackTarget}
              isMyChoice={isMyAttackChoice}
            />
          ) : (
            <GesturePanel
              onSelect={handleGestureSelect}
              selected={myGesture}
              disabled={!canChoose}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperBg },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  round: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.stoneDark,
    fontWeight: '600',
  },
  fortressArea: { alignItems: 'center', gap: 4 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 80 },
  actionArea: { paddingBottom: 8 },
  chosenBadge: { fontSize: 12, color: colors.shieldBlue, fontWeight: '600' },
});
