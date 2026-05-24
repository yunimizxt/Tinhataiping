import { create } from 'zustand';
import { GameState, RoundResult } from '@tinhataiping/shared';

interface GameStore {
  gameState: GameState | null;
  myPlayerId: string | null;
  roomId: string | null;
  lastRoundResult: RoundResult | null;
  error: string | null;

  setGameState: (gs: GameState) => void;
  setMyPlayerId: (id: string) => void;
  setRoomId: (id: string) => void;
  setLastRoundResult: (r: RoundResult | null) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const initial = {
  gameState: null,
  myPlayerId: null,
  roomId: null,
  lastRoundResult: null,
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initial,
  setGameState: (gs) => set({ gameState: gs }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setRoomId: (id) => set({ roomId: id }),
  setLastRoundResult: (r) => set({ lastRoundResult: r }),
  setError: (msg) => set({ error: msg }),
  reset: () => set(initial),
}));
