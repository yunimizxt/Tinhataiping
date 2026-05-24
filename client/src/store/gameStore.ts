import { create } from 'zustand';
import { GameState, AttackTarget, RoundResult } from '@tinhataiping/shared';

interface GameStore {
  gameState: GameState | null;
  myPlayerId: string | null;
  roomId: string | null;
  lastRoundResult: RoundResult | null;
  pendingAttackOptions: AttackTarget[] | null;
  error: string | null;

  setGameState: (gs: GameState) => void;
  setMyPlayerId: (id: string) => void;
  setRoomId: (id: string) => void;
  setLastRoundResult: (r: RoundResult | null) => void;
  setPendingAttackOptions: (opts: AttackTarget[] | null) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const initialState = {
  gameState: null,
  myPlayerId: null,
  roomId: null,
  lastRoundResult: null,
  pendingAttackOptions: null,
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setGameState: (gs) => set({ gameState: gs }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setRoomId: (id) => set({ roomId: id }),
  setLastRoundResult: (r) => set({ lastRoundResult: r }),
  setPendingAttackOptions: (opts) => set({ pendingAttackOptions: opts }),
  setError: (msg) => set({ error: msg }),
  reset: () => set(initialState),
}));
