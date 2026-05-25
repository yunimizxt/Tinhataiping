import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import {
  Gesture, GameState, RoundResult, RoundOutcome, ProgressEvent, AttackChoice,
  createInitialPlayer, resolveGesture, isAttackPhase,
  applyRound, getAttackHit, applyDamage,
  TURN_TIMEOUT_MS,
} from '@tinhataiping/shared';
import { Fortress } from '../components/Fortress';
import { GesturePanel } from '../components/GesturePanel';
import { RoundReveal } from '../components/RoundReveal';
import { TurnTimer } from '../components/TurnTimer';
import { AttackChoicePanel } from '../components/AttackChoicePanel';
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
  const [showAttackChoice, setShowAttackChoice] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const aiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingGestures = useRef<{ pg: Gesture; ag: Gesture } | null>(null);

  function handlePlayerGesture(g: Gesture) {
    if (playerGesture || state.phase !== 'choosing') return;
    setPlayerGesture(g);
    aiTimeout.current = setTimeout(() => {
      resolveRound(g, randomGesture());
    }, AI_THINK_MS);
  }

  function resolveRound(pg: Gesture, ag: Gesture) {
    const outcome = resolveGesture(pg, ag);
    const playerAttacking = isAttackPhase(state.p1);
    const aiAttacking = isAttackPhase(state.p2);

    if ((outcome === 'p1_wins' && playerAttacking) || (outcome === 'p2_wins' && aiAttacking)) {
      // Show gestures only — choice happens after reveal
      setLastResult({
        round: state.round, p1Gesture: pg, p2Gesture: ag,
        outcome, p1Progress: null, p2Progress: null,
      });
      setShowReveal(true);

      setTimeout(() => {
        setShowReveal(false);
        setPlayerGesture(null);

        if (outcome === 'p1_wins') {
          pendingGestures.current = { pg, ag };
          setShowAttackChoice(true);
        } else {
          // AI: 70% attack, 30% extra defense
          const aiChoice: AttackChoice = Math.random() < 0.7 ? 'attack' : 'add_defense';
          executeAttackChoice('p2_wins', aiChoice, pg, ag);
        }
      }, RESOLVE_MS);
    } else {
      // Normal build phase or draw
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

        if (result.p1Progress?.type === 'built_weapon' && !newState.p1.weaponDrawing) {
          setState(newState);
          setShowDrawing(true);
          return;
        }
        setState(newState);
        if (newState.phase !== 'gameover') setTimerKey((k) => k + 1);
      }, RESOLVE_MS);
    }
  }

  function executeAttackChoice(outcome: 'p1_wins' | 'p2_wins', choice: AttackChoice, pg: Gesture, ag: Gesture) {
    setState(prev => {
      let newP1 = { ...prev.p1, gesture: null as Gesture | null, hasChosen: false };
      let newP2 = { ...prev.p2, gesture: null as Gesture | null, hasChosen: false };
      let p1Progress: ProgressEvent | null = null;
      let p2Progress: ProgressEvent | null = null;

      function applyChoice(winner: typeof newP1, defender: typeof newP2) {
        if (choice === 'attack') {
          const hit = getAttackHit(defender);
          return { w: winner, d: applyDamage(defender, hit), ev: { type: 'attacked', hit } as ProgressEvent };
        }
        if (choice === 'add_defense') {
          return { w: { ...winner, shields: Math.min(winner.shields + 1, 3) }, d: defender, ev: { type: 'extra_defense' } as ProgressEvent };
        }
        // new_weapon: reset drawing so canvas triggers after
        return { w: { ...winner, weaponDrawing: null as string | null }, d: defender, ev: { type: 'built_weapon' } as ProgressEvent };
      }

      if (outcome === 'p1_wins') {
        const { w, d, ev } = applyChoice(newP1, newP2);
        newP1 = w; newP2 = d; p1Progress = ev;
      } else {
        const { w, d, ev } = applyChoice(newP2, newP1);
        newP2 = w; newP1 = d; p2Progress = ev;
      }

      const winner = newP2.fortressHp === 0 ? prev.p1.id : newP1.fortressHp === 0 ? prev.p2.id : null;

      return {
        ...prev,
        round: prev.round + 1,
        p1: newP1, p2: newP2,
        phase: winner ? 'gameover' as const : 'choosing' as const,
        winner,
        roundHistory: [...prev.roundHistory, {
          round: prev.round, p1Gesture: pg, p2Gesture: ag,
          outcome, p1Progress, p2Progress,
        }],
      };
    });
  }

  function handlePlayerAttackChoice(choice: AttackChoice) {
    const { pg, ag } = pendingGestures.current!;
    pendingGestures.current = null;
    setShowAttackChoice(false);

    if (choice === 'new_weapon') {
      setState(prev => ({ ...prev, p1: { ...prev.p1, weaponDrawing: null } }));
      setShowDrawing(true);
      return;
    }

    executeAttackChoice('p1_wins', choice, pg, ag);
    setTimerKey(k => k + 1);
  }

  function handleWeaponDrawn(pathData: string) {
    setState(prev => ({ ...prev, p1: { ...prev.p1, weaponDrawing: pathData } }));
    setShowDrawing(false);
    setTimerKey(k => k + 1);
  }

  function handleRestart() {
    setState(createLocalState());
    setPlayerGesture(null);
    setLastResult(null);
    setShowReveal(false);
    setShowDrawing(false);
    setShowAttackChoice(false);
    setTimerKey(k => k + 1);
  }

  useEffect(() => {
    return () => { if (aiTimeout.current) clearTimeout(aiTimeout.current); };
  }, []);

  const isOver = state.phase === 'gameover';
  const canChoose = state.phase === 'choosing' && !playerGesture && !showAttackChoice;

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

        <View style={styles.fortressArea}>
          <Fortress player={state.p2} isOpponent label="Computer 電腦" />
          {playerGesture && !showReveal && !showAttackChoice && (
            <Text style={styles.thinking}>🤔 thinking...</Text>
          )}
        </View>

        <View style={styles.center}>
          {!showAttackChoice && (
            <TurnTimer
              key={timerKey}
              durationMs={TURN_TIMEOUT_MS}
              active={canChoose}
              onExpire={() => !playerGesture && handlePlayerGesture(randomGesture())}
            />
          )}
          {showReveal && lastResult && (
            <RoundReveal result={lastResult} myPlayerId="player" />
          )}
          {showAttackChoice && (
            <AttackChoicePanel
              onAttack={() => handlePlayerAttackChoice('attack')}
              onDefense={() => handlePlayerAttackChoice('add_defense')}
              onWeapon={() => handlePlayerAttackChoice('new_weapon')}
            />
          )}
        </View>

        <View style={styles.fortressArea}>
          <Fortress player={state.p1} label="You 你" />
        </View>

        <GesturePanel
          onSelect={handlePlayerGesture}
          selected={playerGesture}
          disabled={!canChoose}
        />
      </View>

      {showDrawing && (
        <WeaponDrawingCanvas
          playerName="You"
          onDone={handleWeaponDrawn}
          onSkip={() => { setShowDrawing(false); setTimerKey(k => k + 1); }}
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
