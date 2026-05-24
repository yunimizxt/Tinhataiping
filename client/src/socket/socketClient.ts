import { io, Socket } from 'socket.io-client';
import { GameState, RoundResult, Gesture } from '@tinhataiping/shared';
import { useGameStore } from '../store/gameStore';

const SERVER_URL = 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, { transports: ['websocket'] });
    registerHandlers(socket);
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

function registerHandlers(s: Socket) {
  const store = useGameStore.getState;

  s.on('room:created', ({ roomId, gameState }: { roomId: string; gameState: GameState }) => {
    store().setRoomId(roomId);
    store().setMyPlayerId(s.id ?? '');
    store().setGameState(gameState);
  });

  s.on('room:joined', ({ gameState }: { gameState: GameState }) => {
    store().setMyPlayerId(s.id ?? '');
    store().setGameState(gameState);
  });

  s.on('room:error', ({ message }: { message: string }) => {
    store().setError(message);
  });

  s.on('game:opponent_chose', () => {
    const gs = store().gameState;
    if (!gs) return;
    const isP1 = gs.p1.id === s.id;
    store().setGameState({
      ...gs,
      p1: isP1 ? gs.p1 : { ...gs.p1, hasChosen: true },
      p2: isP1 ? { ...gs.p2, hasChosen: true } : gs.p2,
    });
  });

  s.on('game:round_result', ({ result, gameState }: { result: RoundResult; gameState: GameState }) => {
    store().setLastRoundResult(result);
    store().setGameState(gameState);
  });

  s.on('game:state_update', ({ gameState }: { gameState: GameState }) => {
    store().setGameState(gameState);
  });

  s.on('game:over', ({ gameState }: { gameState: GameState }) => {
    store().setGameState(gameState);
  });

  s.on('game:timeout', ({ gameState }: { gameState: GameState }) => {
    store().setGameState(gameState);
  });

  s.on('player:left', () => {
    store().setError('Opponent disconnected');
  });
}

export function createRoom(playerName: string) {
  getSocket().emit('room:create', { playerName });
}

export function joinRoom(roomId: string, playerName: string) {
  getSocket().emit('room:join', { roomId, playerName });
}

export function submitGesture(roomId: string, gesture: Gesture) {
  getSocket().emit('game:gesture', { roomId, gesture });
}

export function requestRematch(roomId: string) {
  getSocket().emit('room:rematch', { roomId });
}
