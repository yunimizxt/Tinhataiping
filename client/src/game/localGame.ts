import { GameState, Gesture, createInitialPlayer, applyRound } from '@tinhataiping/shared';

export function createLocalGameState(): GameState {
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

export function applyLocalRound(
  state: GameState,
  p1Gesture: Gesture,
  p2Gesture: Gesture
): GameState {
  const withGestures: GameState = {
    ...state,
    p1: { ...state.p1, gesture: p1Gesture, hasChosen: true },
    p2: { ...state.p2, gesture: p2Gesture, hasChosen: true },
    phase: 'resolving',
  };
  return applyRound(withGestures);
}
