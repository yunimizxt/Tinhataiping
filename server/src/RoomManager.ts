import {
  GameState,
  PlayerState,
  Gesture,
  createInitialPlayer,
  resolveGesture,
  isAttackPhase,
  getBuildProgress,
  applyProgress,
  applyRound,
  ROOM_CODE_LENGTH,
} from '@tinhataiping/shared';

interface Room {
  id: string;
  gameState: GameState;
  p1SocketId: string;
  p2SocketId: string | null;
  timers: {
    turn?: ReturnType<typeof setTimeout>;
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
    roundHistory: [],
    winner: null,
  };
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToRoom = new Map<string, string>();

  createRoom(socketId: string, playerName: string): Room {
    let roomId: string;
    do { roomId = generateRoomCode(); } while (this.rooms.has(roomId));

    const p1 = createInitialPlayer(socketId, playerName);
    const room: Room = {
      id: roomId,
      gameState: createGameState(roomId, p1),
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
  } | { error: string } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return { error: 'Not in a room' };
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.gameState.phase !== 'choosing') return { error: 'Not in choosing phase' };

    const isP1 = socketId === room.p1SocketId;
    if (isP1) {
      room.gameState.p1.gesture = gesture;
      room.gameState.p1.hasChosen = true;
    } else {
      room.gameState.p2.gesture = gesture;
      room.gameState.p2.hasChosen = true;
    }

    const bothReady = room.gameState.p1.hasChosen && room.gameState.p2.hasChosen;
    return { room, bothReady };
  }

  applyRound(roomId: string): GameState {
    const room = this.rooms.get(roomId)!;
    const state = applyRound(room.gameState);
    room.gameState = state;
    return state;
  }

  setWeaponDrawing(socketId: string, drawingPath: string): Room | { error: string } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return { error: 'Not in a room' };
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    const isP1 = socketId === room.p1SocketId;
    if (isP1) {
      room.gameState.p1.weaponDrawing = drawingPath;
    } else {
      room.gameState.p2.weaponDrawing = drawingPath;
    }
    return room;
  }

  handleDisconnect(socketId: string): { roomId: string; otherSocketId: string | null } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room) return null;
    this.socketToRoom.delete(socketId);
    const otherSocketId = socketId === room.p1SocketId ? room.p2SocketId : room.p1SocketId;
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

  setTimer(room: Room, timer: ReturnType<typeof setTimeout>) {
    if (room.timers.turn) clearTimeout(room.timers.turn);
    room.timers.turn = timer;
  }

  clearTimers(room: Room) {
    if (room.timers.turn) clearTimeout(room.timers.turn);
  }

  forceGesture(roomId: string, randomGesture: () => Gesture): void {
    const room = this.rooms.get(roomId)!;
    if (!room.gameState.p1.hasChosen) {
      room.gameState.p1.gesture = randomGesture();
      room.gameState.p1.hasChosen = true;
    }
    if (!room.gameState.p2.hasChosen) {
      room.gameState.p2.gesture = randomGesture();
      room.gameState.p2.hasChosen = true;
    }
  }
}
