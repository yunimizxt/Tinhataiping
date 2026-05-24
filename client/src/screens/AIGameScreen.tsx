import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import {
  Gesture, GameState, RoundResult,
  createInitialPlayer, resolveGesture, isAttackPhase,
  getBuildProgress, applyProgress, applyRound, getAttackHit, applyDamage,
  TURN_TIMEOUT_MS,
} from '@tinhataiping/shared';
import { Fortress } from '../components/Fortress';
import { GesturePanel } from '../components/GesturePanel';
import { RoundReveal } from '../components/RoundReveal';
import { TurnTimer } from '../components/TurnTimer';
import { WeaponDrawingCanvas } from '../components/WeaponDrawingCanvas';
import { colors } from '../theme/colors';

const GESTURES: Gesture[] = ['rock', 'paper', 'scissors'];
const AI_THINK_MS = 900;
const RESOLVE_MS = 1800;

function randomGesture(): Gesture {
  return GESTURES[Math.floor(Math.random() * 3)];
}

function createLocalState(): GameState {
  return {
    roomId: 'ai',
    phase: 'choosing',
    round: 1,
    p1: createInitialPlayer('player', 'You'),
    p2: createInitialPlayer('ai', 'Computer'),
    roundHistory: [],
    winner: null,
  };
}

export function AIGameScreen({ navigation }: any) {
  const [state, setState] = useState<GameState>(createLocalState);
  const [playerGesture, setPlayerGesture] = useState<Gesture | null>(null);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const aiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When player picks, AI picks after a short delay then resolve
  function handlePlayerGesture(g: Gesture) {
    if (playerGesture || state.phase !== 'choosing') return;
    setPlayerGesture(g);

    aiTimeout.current = setTimeout(() => {
      const aiGesture = randomGesture();
      resolveRound(g, aiGesture);
    }, AI_THINK_MS);
  }

  function resolveRound(pg: Gesture, ag: Gesture) {
    const withGestures: GameState = {
      ...state,
      p1: { ...state.p1, gesture: pg, hasChosen: true },
      p2: { ...state.p2, gesture: ag, hasChosen: true },
      phase: 'resolving',
    };

    const newState = applyRound(withGestures);
    const result = newState.roundHistory[newState.roundHistory.length - 1];

    setLastResult(result);
    setShowReveal(true);

    setTimeout(() => {
      setShowReveal(false);
      setPlayerGesture(null);

      // Check if player just built a weapon — show drawing canvas
      if (result.p1Progress?.type === 'built_weapon' && !newState.p1.weaponDrawing) {
        setState(newState);
        setShowDrawing(true);
        return;
      }

      setState(newState);
      if (newState.phase !== 'gameover') setTimerKey((k) => k + 1);
    }, RESOLVE_MS);
  }

  function handleWeaponDrawn(pathData: string) {
    setState((prev) => ({
      ...prev,
      p1: { ...prev.p1, weaponDrawing: pathData },
    }));
    setShowDrawing(false);
    setTimerKey((k) => k + 1);
  }

  function handleDrawSkip() {
    setShowDrawing(false);
    setTimerKey((k) => k + 1);
  }

  function handleRestart() {
    setState(createLocalState());
    setPlayerGesture(null);
    setLastResult(null);
    setShowReveal(false);
    setShowDrawing(false);
    setTimerKey((k) => k + 1);
  }

  useEffect(() => {
    return () => { if (aiTimeout.current) clearTimeout(aiTimeout.current); };
  }, []);

  const isOver = state.phase === 'gameover';
  const canChoose = state.phase === 'choosing' && !playerGesture;

  if (isOver) {
    const iWon = state.winner === 'player';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.resultEmoji}>{iWon ? '🏆' : '💀'}</Text>
          <Text style={styles.resultText}>{iWon ? 'You Win! 勝利！' : 'Computer Wins!'}</Text>
          <View style={styles.restartRow}>
            <Text style={styles.restartBtn} onPress={handleRestart}>Play Again</Text>
            <Text style={styles.backBtn} onPress={() => navigation.goBack()}>← Home</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.round}>Round {state.round} · vs Computer</Text>

        {/* AI fortress (top) */}
        <View style={styles.fortressArea}>
          <Fortress player={state.p2} isOpponent label="Computer 電腦" />
          {playerGesture && !showReveal && (
            <Text style={styles.thinking}>🤔 thinking...</Text>
          )}
        </View>

        {/* Center: reveal or timer */}
        <View style={styles.center}>
          <TurnTimer
            key={timerKey}
            durationMs={TURN_TIMEOUT_MS}
            active={canChoose}
            onExpire={() => !playerGesture && handlePlayerGesture(randomGesture())}
          />
          {showReveal && lastResult && (
            <RoundReveal result={lastResult} myPlayerId="player" />
          )}
        </View>

        {/* Player fortress (bottom) */}
        <View style={styles.fortressArea}>
          <Fortress player={state.p1} label="You 你" />
        </View>

        {/* Gesture buttons */}
        <GesturePanel
          onSelect={handlePlayerGesture}
          selected={playerGesture}
          disabled={!canChoose}
        />
      </View>

      {/* Weapon drawing overlay */}
      {showDrawing && (
        <WeaponDrawingCanvas
          playerName="You"
          onDone={handleWeaponDrawn}
          onSkip={handleDrawSkip}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperBg },
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'space-between' },
  round: { textAlign: 'center', fontSize: 13, color: colors.stoneDark, fontWeight: '600' },
  fortressArea: { alignItems: 'center', gap: 4 },
  center: { alignItems: 'center', gap: 8, minHeight: 90 },
  thinking: { fontSize: 13, color: colors.gray, fontStyle: 'italic' },
  resultEmoji: { fontSize: 64 },
  resultText: { fontSize: 26, fontWeight: 'bold', color: colors.inkBlack },
  restartRow: { flexDirection: 'row', gap: 24, marginTop: 24 },
  restartBtn: {
    fontSize: 15, fontWeight: 'bold', color: colors.white,
    backgroundColor: colors.buttonWood, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10,
  },
  backBtn: { fontSize: 15, color: colors.stoneDark, paddingVertical: 12 },
});
