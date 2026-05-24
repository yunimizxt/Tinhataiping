import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal,
} from 'react-native';
import { Gesture, AttackTarget, getAttackOptions } from '@tinhataiping/shared';
import {
  createLocalGameState,
  submitLocalGestures,
  applyLocalRound,
} from '../game/localGame';
import { Fortress } from '../components/Fortress';
import { GesturePanel } from '../components/GesturePanel';
import { AttackChoicePanel } from '../components/AttackChoicePanel';
import { RoundReveal } from '../components/RoundReveal';
import { colors } from '../theme/colors';
import type { GameState, RoundResult } from '@tinhataiping/shared';

export function LocalGameScreen() {
  const [gameState, setGameState] = useState<GameState>(createLocalGameState);
  const [p1Gesture, setP1Gesture] = useState<Gesture | null>(null);
  const [p2Gesture, setP2Gesture] = useState<Gesture | null>(null);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1'); // whose turn to show gesture buttons
  const [showPassModal, setShowPassModal] = useState(false);
  const [pendingAttack, setPendingAttack] = useState<{
    winnerId: string;
    options: AttackTarget[];
  } | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [resolving, setResolving] = useState(false);

  const isOver = gameState.phase === 'gameover';

  function handleP1Pick(g: Gesture) {
    setP1Gesture(g);
    setShowPassModal(true); // pass to P2
  }

  function onPassConfirm() {
    setShowPassModal(false);
    setTurn('p2');
  }

  function handleP2Pick(g: Gesture) {
    setP2Gesture(g);
    // Resolve immediately
    const { state, needsAttackChoice, winnerId, attackOptions } = submitLocalGestures(
      gameState, p1Gesture!, g
    );
    setGameState(state);
    setResolving(true);

    if (needsAttackChoice && winnerId && attackOptions) {
      setPendingAttack({ winnerId, options: attackOptions });
    } else {
      setTimeout(() => resolveRound(state, undefined), 1500);
    }
  }

  function resolveRound(state: GameState, attackTarget?: AttackTarget) {
    const newState = applyLocalRound(state, attackTarget);
    const result = newState.roundHistory[newState.roundHistory.length - 1];
    setLastResult(result);
    setGameState(newState);
    setP1Gesture(null);
    setP2Gesture(null);
    setPendingAttack(null);
    setResolving(false);
    setTurn('p1');
  }

  function handleAttackChoice(target: AttackTarget) {
    resolveRound(gameState, target);
  }

  function handleRestart() {
    setGameState(createLocalGameState());
    setP1Gesture(null);
    setP2Gesture(null);
    setTurn('p1');
    setPendingAttack(null);
    setLastResult(null);
    setResolving(false);
  }

  if (isOver) {
    const winnerName = gameState.winner === 'local-p1' ? 'Player 1' : 'Player 2';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.winText}>🏆 {winnerName} wins!</Text>
          <Text style={styles.winCn}>勝利！</Text>
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart}>
            <Text style={styles.restartText}>Play Again 再玩一次</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const showAttackChoice = pendingAttack != null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.round}>Round {gameState.round} — Local Mode</Text>

        <View style={styles.fortressArea}>
          <Fortress player={gameState.p2} isOpponent label="Player 2" />
        </View>

        <View style={styles.center}>
          {resolving && lastResult && (
            <RoundReveal result={lastResult} myPlayerId="local-p1" />
          )}
          {showAttackChoice && (
            <AttackChoicePanel
              options={pendingAttack!.options}
              onSelect={handleAttackChoice}
              isMyChoice
            />
          )}
        </View>

        <View style={styles.fortressArea}>
          <Fortress player={gameState.p1} label="Player 1" />
        </View>

        {!resolving && !showAttackChoice && (
          <View style={styles.actionArea}>
            <Text style={styles.turnLabel}>
              {turn === 'p1' ? '🎮 Player 1 — choose your gesture' : '🎮 Player 2 — choose your gesture'}
            </Text>
            <GesturePanel
              onSelect={turn === 'p1' ? handleP1Pick : handleP2Pick}
              selected={turn === 'p1' ? p1Gesture : p2Gesture}
              disabled={false}
            />
          </View>
        )}

        {/* Pass device modal */}
        <Modal visible={showPassModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Pass to Player 2 🎮</Text>
              <Text style={styles.modalSub}>Player 1 has chosen. Now pass the phone!</Text>
              <TouchableOpacity style={styles.modalBtn} onPress={onPassConfirm}>
                <Text style={styles.modalBtnText}>Ready! 準備好了</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperBg },
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'space-between' },
  round: { textAlign: 'center', fontSize: 13, color: colors.stoneDark, fontWeight: '600' },
  fortressArea: { alignItems: 'center' },
  center: { alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  actionArea: { gap: 8 },
  turnLabel: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.inkBlack },

  winText: { fontSize: 32, fontWeight: 'bold', color: colors.accentGold },
  winCn: { fontSize: 20, color: colors.stoneDark },
  restartBtn: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: colors.buttonWood,
    borderRadius: 12,
  },
  restartText: { fontSize: 16, fontWeight: 'bold', color: colors.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modal: {
    backgroundColor: colors.paperBg,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    width: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.inkBlack },
  modalSub: { fontSize: 14, color: colors.stoneDark, textAlign: 'center' },
  modalBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.buttonWood, borderRadius: 10 },
  modalBtnText: { fontSize: 15, fontWeight: 'bold', color: colors.white },
});
