import {
  GameState,
  PlayerState,
  Gesture,
  AttackTarget,
  GamePhase,
  createInitialPlayer,
  resolveGesture,
  isAttackPhase,
  getBuildProgress,
  applyProgress,
  resolveAttack,
  applyDamage,
  getAttackOptions,
  applyRound,
  RoundResult,
  ROOM_CODE_LENGTH,
  FORTRESS_MAX_HP,
} from '@tinhataiping/shared';

interface Room {
  id: string;
  gameState: GameState;
  p1SocketId: string;
  p2SocketId: string | null;
  timers: {
    turn?: ReturnType<typeof setTimeout>;
    attackChoice?: ReturnType<typeof setTimeout>;
  };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createGameState(roomId: string, p1: PlayerState, p2?: PlayerState): GameState {
  return {
    roomId,
    phase: p2 ? 'choosing' : 'waiting',
    round: 1,
    p1,
    p2: p2 ?? createInitialPlayer('', ''),
    pendingAttackWinnerId: null,
    roundHistory: [],
    winner: null,
  };
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToRoom = new Map<string, string>();

  createRoom(socketId: string, playerName: string): Room {
    let roomId: string;
    do {
      roomId = generateRoomCode();
    } while (this.rooms.has(roomId));

    const p1 = createInitialPlayer(socketId, playerName);
    const gameState = createGameState(roomId, p1);

    const room: Room = {
      id: roomId,
      gameState,
      p1SocketId: socketId,
      p2SocketId: null,
      timers: {},
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(socketId, roomId);
    return room;
  }

  joinRoom(socketId: string, roomId: string, playerName: string): Room | { error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.p2SocketId) return { error: 'Room is full' };
    if (room.p1SocketId === socketId) return { error: 'Already in this room' };

    const p2 = createInitialPlayer(socketId, playerName);
    room.p2SocketId = socketId;
    room.gameState.p2 = p2;
    room.gameState.phase = 'choosing';
    this.socketToRoom.set(socketId, roomId);
    return room;
  }

  submitGesture(socketId: string, gesture: Gesture): {
    room: Room;
    bothReady: boolean;
    needsAttackChoice: boolean;
    attackOptions?: AttackTarget[];
  } | { error: string } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return { error: 'Not in a room' };
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    const { gameState } = room;
    if (gameState.phase !== 'choosing') return { error: 'Not in choosing phase' };

    const isP1 = socketId === room.p1SocketId;
    if (isP1) {
      gameState.p1.gesture = gesture;
      gameState.p1.hasChosen = true;
    } else {
      gameState.p2.gesture = gesture;
      gameState.p2.hasChosen = true;
    }

    const bothReady = gameState.p1.hasChosen && gameState.p2.hasChosen;
    if (!bothReady) return { room, bothReady: false, needsAttackChoice: false };

    // Both chose — resolve gesture outcome
    const outcome = resolveGesture(gameState.p1.gesture!, gameState.p2.gesture!);
    gameState.phase = 'resolving';

    if (outcome === 'draw') {
      return { room, bothReady: true, needsAttackChoice: false };
    }

    const winner = outcome === 'p1_wins' ? gameState.p1 : gameState.p2;
    const defender = outcome === 'p1_wins' ? gameState.p2 : gameState.p1;

    if (isAttackPhase(winner)) {
      const attackOptions = getAttackOptions(defender);
      gameState.pendingAttackWinnerId = winner.id;
      return { room, bothReady: true, needsAttackChoice: true, attackOptions };
    }

    return { room, bothReady: true, needsAttackChoice: false };
  }

  applyGestureResult(roomId: string): GameState {
    const room = this.rooms.get(roomId)!;
    const state = applyRound(room.gameState);
    room.gameState = state;
    return state;
  }

  submitAttackTarget(socketId: string, target: AttackTarget): Room | { error: string } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return { error: 'Not in a room' };
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.gameState.phase !== 'attack_choice') return { error: 'Not in attack choice phase' };
    if (room.gameState.pendingAttackWinnerId !== socketId) return { error: 'Not your turn to choose' };

    const state = applyRound(room.gameState, target);
    room.gameState = state;
    return room;
  }

  handleDisconnect(socketId: string): { roomId: string; otherSocketId: string | null } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    this.socketToRoom.delete(socketId);
    const otherSocketId =
      socketId === room.p1SocketId ? room.p2SocketId : room.p1SocketId;

    this.clearTimers(room);
    this.rooms.delete(roomId);
    if (otherSocketId) this.socketToRoom.delete(otherSocketId);

    return { roomId, otherSocketId };
  }

  rematch(socketId: string): Room | { error: string } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return { error: 'Not in a room' };
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    const p1 = createInitialPlayer(room.p1SocketId, room.gameState.p1.name);
    const p2 = createInitialPlayer(room.p2SocketId!, room.gameState.p2.name);
    room.gameState = createGameState(roomId, p1, p2);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  setTimer(room: Room, type: 'turn' | 'attackChoice', timer: ReturnType<typeof setTimeout>) {
    if (room.timers[type]) clearTimeout(room.timers[type]);
    room.timers[type === 'turn' ? 'turn' : 'attackChoice'] = timer;
  }

  clearTimers(room: Room) {
    if (room.timers.turn) clearTimeout(room.timers.turn);
    if (room.timers.attackChoice) clearTimeout(room.timers.attackChoice);
  }

  forceGesture(roomId: string, randomGesture: () => Gesture): GameState {
    const room = this.rooms.get(roomId)!;
    const { gameState } = room;
    if (!gameState.p1.hasChosen) {
      gameState.p1.gesture = randomGesture();
      gameState.p1.hasChosen = true;
    }
    if (!gameState.p2.hasChosen) {
      gameState.p2.gesture = randomGesture();
      gameState.p2.hasChosen = true;
    }
    return gameState;
  }
}
