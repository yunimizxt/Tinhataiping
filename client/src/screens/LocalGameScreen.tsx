import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Modal, TouchableOpacity } from 'react-native';
import {
  Gesture, GameState, RoundResult, RoundOutcome, ProgressEvent, AttackChoice,
  createInitialPlayer, resolveGesture, isAttackPhase,
  applyRound, getAttackHit, applyDamage,
} from '@tinhataiping/shared';
import { Fortress } from '../components/Fortress';
import { GesturePanel } from '../components/GesturePanel';
import { RoundReveal } from '../components/RoundReveal';
import { AttackChoicePanel } from '../components/AttackChoicePanel';
import { WeaponDrawingCanvas } from '../components/WeaponDrawingCanvas';
import { colors } from '../theme/colors';

const RESOLVE_MS = 1800;

function createLocalState(): GameState {
  return {
    roomId: 'local',
    phase: 'choosing',
    round: 1,
    p1: createInitialPlayer('local-p1', 'Player 1'),
    p2: createInitialPlayer('local-p2', 'Player 2'),
    roundHistory: [],
    winner: null,
  };
}

export function LocalGameScreen({ navigation }: any) {
  const [state, setState] = useState<GameState>(createLocalState);
  const [p1Gesture, setP1Gesture] = useState<Gesture | null>(null);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [showPassModal, setShowPassModal] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [drawingPlayer, setDrawingPlayer] = useState<'p1' | 'p2' | null>(null);
  // attack choice: which player is choosing, and what gestures were played
  const [attackChoiceFor, setAttackChoiceFor] = useState<'p1' | 'p2' | null>(null);
  const pendingGestures = useRef<{ pg: Gesture; ag: Gesture; outcome: RoundOutcome } | null>(null);

  const isOver = state.phase === 'gameover';

  function handleP1Pick(g: Gesture) {
    setP1Gesture(g);
    setShowPassModal(true);
  }

  function handleP2Pick(g: Gesture) {
    const pg = p1Gesture!;
    const ag = g;
    const outcome = resolveGesture(pg, ag);
    const p1Attacking = isAttackPhase(state.p1);
    const p2Attacking = isAttackPhase(state.p2);

    if ((outcome === 'p1_wins' && p1Attacking) || (outcome === 'p2_wins' && p2Attacking)) {
      // Show gestures only, then let winner choose action
      setLastResult({
        round: state.round, p1Gesture: pg, p2Gesture: ag,
        outcome, p1Progress: null, p2Progress: null,
      });
      setShowReveal(true);

      setTimeout(() => {
        setShowReveal(false);
        setP1Gesture(null);
        setTurn('p1');
        pendingGestures.current = { pg, ag, outcome };
        setAttackChoiceFor(outcome === 'p1_wins' ? 'p1' : 'p2');
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
        setP1Gesture(null);
        setTurn('p1');

        if (result.p1Progress?.type === 'built_weapon' && !newState.p1.weaponDrawing) {
          setState(newState); setDrawingPlayer('p1'); return;
        }
        if (result.p2Progress?.type === 'built_weapon' && !newState.p2.weaponDrawing) {
          setState(newState); setDrawingPlayer('p2'); return;
        }
        setState(newState);
      }, RESOLVE_MS);
    }
  }

  function handleAttackChoice(choice: AttackChoice) {
    const { pg, ag, outcome } = pendingGestures.current!;
    pendingGestures.current = null;
    const winner = attackChoiceFor!;
    setAttackChoiceFor(null);

    if (choice === 'new_weapon') {
      setState(prev => ({
        ...prev,
        p1: winner === 'p1' ? { ...prev.p1, weaponDrawing: null } : prev.p1,
        p2: winner === 'p2' ? { ...prev.p2, weaponDrawing: null } : prev.p2,
      }));
      setDrawingPlayer(winner);
      return;
    }

    setState(prev => {
      let newP1 = { ...prev.p1, gesture: null as Gesture | null, hasChosen: false };
      let newP2 = { ...prev.p2, gesture: null as Gesture | null, hasChosen: false };
      let p1Progress: ProgressEvent | null = null;
      let p2Progress: ProgressEvent | null = null;

      function applyChoice(w: typeof newP1, d: typeof newP2) {
        if (choice === 'attack') {
          const hit = getAttackHit(d);
          return { w, d: applyDamage(d, hit), ev: { type: 'attacked', hit } as ProgressEvent };
        }
        return { w: { ...w, shields: Math.min(w.shields + 1, 3) }, d, ev: { type: 'extra_defense' } as ProgressEvent };
      }

      if (winner === 'p1') {
        const { w, d, ev } = applyChoice(newP1, newP2);
        newP1 = w; newP2 = d; p1Progress = ev;
      } else {
        const { w, d, ev } = applyChoice(newP2, newP1);
        newP2 = w; newP1 = d; p2Progress = ev;
      }

      const gameWinner = newP2.fortressHp === 0 ? prev.p1.id : newP1.fortressHp === 0 ? prev.p2.id : null;

      return {
        ...prev,
        round: prev.round + 1,
        p1: newP1, p2: newP2,
        phase: gameWinner ? 'gameover' as const : 'choosing' as const,
        winner: gameWinner,
        roundHistory: [...prev.roundHistory, {
          round: prev.round, p1Gesture: pg, p2Gesture: ag,
          outcome, p1Progress, p2Progress,
        }],
      };
    });
  }

  function handleWeaponDrawn(pathData: string) {
    setState(prev => ({
      ...prev,
      p1: drawingPlayer === 'p1' ? { ...prev.p1, weaponDrawing: pathData } : prev.p1,
      p2: drawingPlayer === 'p2' ? { ...prev.p2, weaponDrawing: pathData } : prev.p2,
    }));
    setDrawingPlayer(null);
  }

  function handleRestart() {
    setState(createLocalState());
    setP1Gesture(null); setTurn('p1');
    setLastResult(null); setShowReveal(false);
    setDrawingPlayer(null); setAttackChoiceFor(null);
  }

  if (isOver) {
    const winner = state.winner === 'local-p1' ? 'Player 1' : 'Player 2';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.winEmoji}>🏆</Text>
          <Text style={styles.winText}>{winner} Wins!</Text>
          <TouchableOpacity style={styles.btn} onPress={handleRestart}>
            <Text style={styles.btnText}>Play Again 再玩</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const showingAttackChoice = attackChoiceFor !== null;
  const choiceLabel = attackChoiceFor === 'p1' ? 'Player 1' : 'Player 2';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.round}>Round {state.round} · Local</Text>

        <View style={styles.fortressArea}>
          <Fortress player={state.p2} isOpponent label="Player 2" />
        </View>

        <View style={styles.center}>
          {showReveal && lastResult && (
            <RoundReveal result={lastResult} myPlayerId="local-p1" />
          )}
          {showingAttackChoice && (
            <View style={styles.choiceWrap}>
              <Text style={styles.choiceLabel}>{choiceLabel} — choose your action:</Text>
              <AttackChoicePanel
                onAttack={() => handleAttackChoice('attack')}
                onDefense={() => handleAttackChoice('add_defense')}
                onWeapon={() => handleAttackChoice('new_weapon')}
              />
            </View>
          )}
        </View>

        <View style={styles.fortressArea}>
          <Fortress player={state.p1} label="Player 1" />
        </View>

        {!showReveal && !showingAttackChoice && (
          <View style={styles.actionArea}>
            <Text style={styles.turnLabel}>
              {turn === 'p1' ? '🎮 Player 1 — pick your gesture' : '🎮 Player 2 — pick your gesture'}
            </Text>
            <GesturePanel
              onSelect={turn === 'p1' ? handleP1Pick : handleP2Pick}
              selected={turn === 'p1' ? p1Gesture : null}
              disabled={false}
            />
          </View>
        )}
      </View>

      <Modal visible={showPassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pass to Player 2 🎮</Text>
            <Text style={styles.modalSub}>Player 1 has chosen. Pass the phone!</Text>
            <TouchableOpacity style={styles.btn} onPress={() => {
              setShowPassModal(false); setTurn('p2');
            }}>
              <Text style={styles.btnText}>Ready! 準備好了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {drawingPlayer && (
        <WeaponDrawingCanvas
          playerName={drawingPlayer === 'p1' ? 'Player 1' : 'Player 2'}
          onDone={handleWeaponDrawn}
          onSkip={() => setDrawingPlayer(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperBg },
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'space-between' },
  round: { textAlign: 'center', fontSize: 13, color: colors.stoneDark, fontWeight: '600' },
  fortressArea: { alignItems: 'center' },
  center: { alignItems: 'center', minHeight: 80, justifyContent: 'center', gap: 6 },
  actionArea: { gap: 8 },
  turnLabel: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.inkBlack },
  choiceWrap: { width: '100%', gap: 4 },
  choiceLabel: { textAlign: 'center', fontSize: 12, color: colors.stoneDark, fontWeight: '600' },
  winEmoji: { fontSize: 64 },
  winText: { fontSize: 28, fontWeight: 'bold', color: colors.inkBlack },
  btn: { paddingHorizontal: 28, paddingVertical: 14, backgroundColor: colors.buttonWood, borderRadius: 10, marginTop: 12 },
  btnText: { fontSize: 15, fontWeight: 'bold', color: colors.white },
  back: { fontSize: 14, color: colors.stoneDark, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.paperBg, borderRadius: 16, padding: 28, alignItems: 'center', gap: 12, width: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.inkBlack },
  modalSub: { fontSize: 14, color: colors.stoneDark, textAlign: 'center' },
});
