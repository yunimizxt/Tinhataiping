import {
  GameState,
  PlayerState,
  Gesture,
  AttackTarget,
  createInitialPlayer,
  resolveGesture,
  isAttackPhase,
  getBuildProgress,
  applyProgress,
  resolveAttack,
  applyDamage,
  getAttackOptions,
  applyRound,
} from '@tinhataiping/shared';

export function createLocalGameState(): GameState {
  const p1 = createInitialPlayer('local-p1', 'Player 1');
  const p2 = createInitialPlayer('local-p2', 'Player 2');
  return {
    roomId: 'local',
    phase: 'choosing',
    round: 1,
    p1,
    p2,
    pendingAttackWinnerId: null,
    roundHistory: [],
    winner: null,
  };
}

export function submitLocalGestures(
  state: GameState,
  p1Gesture: Gesture,
  p2Gesture: Gesture
): { state: GameState; needsAttackChoice: boolean; winnerId?: string; attackOptions?: AttackTarget[] } {
  const newState: GameState = {
    ...state,
    p1: { ...state.p1, gesture: p1Gesture, hasChosen: true },
    p2: { ...state.p2, gesture: p2Gesture, hasChosen: true },
    phase: 'resolving',
  };

  const outcome = resolveGesture(p1Gesture, p2Gesture);
  if (outcome === 'draw') {
    return { state: newState, needsAttackChoice: false };
  }

  const winner = outcome === 'p1_wins' ? newState.p1 : newState.p2;
  const defender = outcome === 'p1_wins' ? newState.p2 : newState.p1;

  if (isAttackPhase(winner)) {
    const attackOptions = getAttackOptions(defender);
    return {
      state: { ...newState, phase: 'attack_choice', pendingAttackWinnerId: winner.id },
      needsAttackChoice: true,
      winnerId: winner.id,
      attackOptions,
    };
  }

  return { state: newState, needsAttackChoice: false };
}

export function applyLocalRound(state: GameState, attackTarget?: AttackTarget): GameState {
  return applyRound(state, attackTarget);
}
