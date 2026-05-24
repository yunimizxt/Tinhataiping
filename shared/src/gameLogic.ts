import {
  Gesture,
  RoundOutcome,
  PlayerState,
  GameState,
  ProgressEvent,
  AttackTarget,
  HitResult,
  RoundResult,
} from './types';
import { MAX_FLAGS, MAX_SHIELDS } from './constants';

// Rock beats Scissors, Scissors beats Paper, Paper beats Rock
export const GESTURE_BEATS: Record<Gesture, Gesture> = {
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
};

export function resolveGesture(g1: Gesture, g2: Gesture): RoundOutcome {
  if (g1 === g2) return 'draw';
  return GESTURE_BEATS[g1] === g2 ? 'p1_wins' : 'p2_wins';
}

export function isAttackPhase(player: PlayerState): boolean {
  return (
    player.flags === MAX_FLAGS &&
    player.shields === MAX_SHIELDS &&
    (player.hasCannon || player.hasAircraft)
  );
}

export function needsRepair(player: PlayerState): boolean {
  // Player has advanced beyond a tier but lost a component from that tier
  const hasBeyondFlags = player.shields > 0 || player.hasCannon || player.hasAircraft;
  const hasBeyondShields = player.hasCannon || player.hasAircraft;
  return (
    (hasBeyondFlags && player.flags < MAX_FLAGS) ||
    (hasBeyondShields && player.shields < MAX_SHIELDS)
  );
}

// Determines what a winner automatically earns during the build phase
export function getBuildProgress(winner: PlayerState): ProgressEvent {
  // Repair takes priority
  if (needsRepair(winner)) {
    if (winner.flags < MAX_FLAGS) return { type: 'repaired_flag' };
    return { type: 'repaired_shield' };
  }
  if (winner.flags < MAX_FLAGS) return { type: 'built_flag' };
  if (winner.shields < MAX_SHIELDS) return { type: 'built_shield' };
  if (!winner.hasCannon) return { type: 'built_cannon' };
  return { type: 'built_aircraft' };
}

// Resolve what the attack hits (called with winner's chosen target)
export function resolveAttack(target: AttackTarget, defender: PlayerState): ProgressEvent {
  if (target === 'cannon') return { type: 'attacked', target, hit: 'cannon' };
  if (target === 'aircraft') return { type: 'attacked', target, hit: 'aircraft' };
  // target === 'base': peel outermost layer
  const hit: HitResult =
    defender.shields > 0 ? 'shield' :
    defender.flags > 0 ? 'flag' :
    'fortress';
  return { type: 'attacked', target, hit };
}

export function applyProgress(player: PlayerState, event: ProgressEvent): PlayerState {
  const p = { ...player };
  switch (event.type) {
    case 'built_flag':
    case 'repaired_flag':
      p.flags = Math.min(MAX_FLAGS, p.flags + 1);
      break;
    case 'built_shield':
    case 'repaired_shield':
      p.shields = Math.min(MAX_SHIELDS, p.shields + 1);
      break;
    case 'built_cannon':
      p.hasCannon = true;
      break;
    case 'built_aircraft':
      p.hasAircraft = true;
      break;
  }
  return p;
}

export function applyDamage(defender: PlayerState, hit: HitResult): PlayerState {
  const p = { ...defender };
  switch (hit) {
    case 'shield':   p.shields = Math.max(0, p.shields - 1); break;
    case 'flag':     p.flags = Math.max(0, p.flags - 1); break;
    case 'fortress': p.fortressHp = Math.max(0, p.fortressHp - 1); break;
    case 'cannon':   p.hasCannon = false; break;
    case 'aircraft': p.hasAircraft = false; break;
  }
  return p;
}

// Returns valid attack targets for the attacker given the defender's state
export function getAttackOptions(defender: PlayerState): AttackTarget[] {
  const opts: AttackTarget[] = ['base'];
  if (defender.hasCannon) opts.push('cannon');
  if (defender.hasAircraft) opts.push('aircraft');
  return opts;
}

// Apply a full round once gestures are known AND (if attack phase) target is chosen
export function applyRound(state: GameState, attackTarget?: AttackTarget): GameState {
  const { p1, p2 } = state;
  const outcome = resolveGesture(p1.gesture!, p2.gesture!);

  let newP1: PlayerState = { ...p1, gesture: null, hasChosen: false };
  let newP2: PlayerState = { ...p2, gesture: null, hasChosen: false };
  let p1Progress: ProgressEvent | null = null;
  let p2Progress: ProgressEvent | null = null;

  if (outcome === 'p1_wins') {
    if (isAttackPhase(p1)) {
      const target = attackTarget ?? 'base';
      p1Progress = resolveAttack(target, newP2);
      newP2 = applyDamage(newP2, (p1Progress as Extract<ProgressEvent, { type: 'attacked' }>).hit);
    } else {
      p1Progress = getBuildProgress(p1);
      newP1 = applyProgress(newP1, p1Progress);
    }
  } else if (outcome === 'p2_wins') {
    if (isAttackPhase(p2)) {
      const target = attackTarget ?? 'base';
      p2Progress = resolveAttack(target, newP1);
      newP1 = applyDamage(newP1, (p2Progress as Extract<ProgressEvent, { type: 'attacked' }>).hit);
    } else {
      p2Progress = getBuildProgress(p2);
      newP2 = applyProgress(newP2, p2Progress);
    }
  }

  const winner =
    newP2.fortressHp === 0 ? p1.id :
    newP1.fortressHp === 0 ? p2.id :
    null;

  const result: RoundResult = {
    round: state.round,
    p1Gesture: p1.gesture!,
    p2Gesture: p2.gesture!,
    outcome,
    p1Progress,
    p2Progress,
  };

  return {
    ...state,
    round: state.round + 1,
    p1: newP1,
    p2: newP2,
    pendingAttackWinnerId: null,
    phase: winner ? 'gameover' : 'choosing',
    roundHistory: [...state.roundHistory, result],
    winner,
  };
}

export function createInitialPlayer(id: string, name: string): PlayerState {
  return {
    id,
    name,
    fortressHp: 4,
    flags: 0,
    shields: 0,
    hasCannon: false,
    hasAircraft: false,
    gesture: null,
    hasChosen: false,
  };
}
