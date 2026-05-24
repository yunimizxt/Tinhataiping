import {
  Gesture,
  RoundOutcome,
  PlayerState,
  GameState,
  ProgressEvent,
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
  return player.flags === MAX_FLAGS && player.shields === MAX_SHIELDS && player.hasWeapon;
}

export const MAX_FORTRESS_HP = 4;

export function needsRepair(player: PlayerState): boolean {
  const hasBeyondFlags = player.shields > 0 || player.hasWeapon;
  const hasBeyondShields = player.hasWeapon;
  return (
    player.fortressHp < MAX_FORTRESS_HP ||
    (hasBeyondFlags && player.flags < MAX_FLAGS) ||
    (hasBeyondShields && player.shields < MAX_SHIELDS)
  );
}

// What a winner earns during the build phase (auto-progressive, no choice)
// Priority: repair flags → repair shields → repair fortress → build next tier
export function getBuildProgress(winner: PlayerState): ProgressEvent {
  if (needsRepair(winner)) {
    const hasBeyondFlags = winner.shields > 0 || winner.hasWeapon;
    const hasBeyondShields = winner.hasWeapon;
    if (hasBeyondFlags && winner.flags < MAX_FLAGS) return { type: 'repaired_flag' };
    if (hasBeyondShields && winner.shields < MAX_SHIELDS) return { type: 'repaired_shield' };
    if (winner.fortressHp < MAX_FORTRESS_HP) return { type: 'repaired_fortress' };
  }
  if (winner.flags < MAX_FLAGS) return { type: 'built_flag' };
  if (winner.shields < MAX_SHIELDS) return { type: 'built_shield' };
  return { type: 'built_weapon' };
}

// Attack always hits outermost layer: shield → flag → fortress character
export function getAttackHit(defender: PlayerState): HitResult {
  if (defender.shields > 0) return 'shield';
  if (defender.flags > 0) return 'flag';
  return 'fortress';
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
    case 'built_weapon':
      p.hasWeapon = true;
      break;
    case 'repaired_fortress':
      p.fortressHp = Math.min(MAX_FORTRESS_HP, p.fortressHp + 1);
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
  }
  return p;
}

export function applyRound(state: GameState): GameState {
  const { p1, p2 } = state;
  const outcome = resolveGesture(p1.gesture!, p2.gesture!);

  let newP1: PlayerState = { ...p1, gesture: null, hasChosen: false };
  let newP2: PlayerState = { ...p2, gesture: null, hasChosen: false };
  let p1Progress: ProgressEvent | null = null;
  let p2Progress: ProgressEvent | null = null;

  if (outcome === 'p1_wins') {
    if (isAttackPhase(p1)) {
      const hit = getAttackHit(newP2);
      p1Progress = { type: 'attacked', hit };
      newP2 = applyDamage(newP2, hit);
    } else {
      p1Progress = getBuildProgress(p1);
      newP1 = applyProgress(newP1, p1Progress);
    }
  } else if (outcome === 'p2_wins') {
    if (isAttackPhase(p2)) {
      const hit = getAttackHit(newP1);
      p2Progress = { type: 'attacked', hit };
      newP1 = applyDamage(newP1, hit);
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
    hasWeapon: false,
    weaponDrawing: null,
    gesture: null,
    hasChosen: false,
  };
}
