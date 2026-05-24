import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  Gesture,
  AttackTarget,
  CreateRoomPayload,
  JoinRoomPayload,
  GesturePayload,
  AttackTargetPayload,
  RematchPayload,
  TURN_TIMEOUT_MS,
  RESOLVE_DISPLAY_MS,
  ATTACK_CHOICE_TIMEOUT_MS,
} from '@tinhataiping/shared';
import { RoomManager } from './RoomManager';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rooms = new RoomManager();

const GESTURES: Gesture[] = ['rock', 'paper', 'scissors'];
const randomGesture = (): Gesture => GESTURES[Math.floor(Math.random() * 3)];

function resolveRound(roomId: string, attackTarget?: AttackTarget) {
  const room = rooms.getRoom(roomId);
  if (!room) return;

  const newState = rooms.applyGestureResult(roomId);
  io.to(roomId).emit('game:round_result', {
    result: newState.roundHistory[newState.roundHistory.length - 1],
    gameState: newState,
  });

  if (newState.phase === 'gameover') {
    io.to(roomId).emit('game:over', { winner: newState.winner, gameState: newState });
    return;
  }

  startTurnTimer(roomId);
}

function startTurnTimer(roomId: string) {
  const room = rooms.getRoom(roomId);
  if (!room) return;

  rooms.setTimer(room, 'turn', setTimeout(() => {
    const r = rooms.getRoom(roomId);
    if (!r || r.gameState.phase !== 'choosing') return;
    const state = rooms.forceGesture(roomId, randomGesture);
    io.to(roomId).emit('game:timeout', { gameState: state });
    resolveRound(roomId);
  }, TURN_TIMEOUT_MS));
}

function startAttackChoiceTimer(roomId: string, winnerId: string) {
  const room = rooms.getRoom(roomId);
  if (!room) return;

  rooms.setTimer(room, 'attackChoice', setTimeout(() => {
    const r = rooms.getRoom(roomId);
    if (!r || r.gameState.phase !== 'attack_choice') return;
    // Default to 'base' on timeout
    const newState = rooms.applyGestureResult(roomId);
    io.to(roomId).emit('game:round_result', {
      result: newState.roundHistory[newState.roundHistory.length - 1],
      gameState: newState,
    });
    if (newState.phase !== 'gameover') startTurnTimer(roomId);
    else io.to(roomId).emit('game:over', { winner: newState.winner, gameState: newState });
  }, ATTACK_CHOICE_TIMEOUT_MS));
}

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  socket.on('room:create', (payload: CreateRoomPayload) => {
    const room = rooms.createRoom(socket.id, payload.playerName);
    socket.join(room.id);
    socket.emit('room:created', { roomId: room.id, gameState: room.gameState });
  });

  socket.on('room:join', (payload: JoinRoomPayload) => {
    const result = rooms.joinRoom(socket.id, payload.roomId, payload.playerName);
    if ('error' in result) {
      socket.emit('room:error', { message: result.error });
      return;
    }
    socket.join(result.id);
    io.to(result.id).emit('room:joined', { gameState: result.gameState });
    // Both players present — start first turn
    setTimeout(() => startTurnTimer(result.id), RESOLVE_DISPLAY_MS);
  });

  socket.on('game:gesture', (payload: GesturePayload) => {
    const result = rooms.submitGesture(socket.id, payload.gesture);
    if ('error' in result) {
      socket.emit('room:error', { message: result.error });
      return;
    }

    const { room, bothReady, needsAttackChoice, attackOptions } = result;

    if (!bothReady) {
      // Tell opponent that this player has chosen (without revealing gesture)
      socket.to(room.id).emit('game:opponent_chose', {});
      return;
    }

    rooms.clearTimers(room);

    if (needsAttackChoice) {
      room.gameState.phase = 'attack_choice';
      io.to(room.id).emit('game:attack_choice', {
        winnerId: room.gameState.pendingAttackWinnerId,
        options: attackOptions,
        gameState: room.gameState,
      });
      // Give winner time to pick; server-apply gestures happen after target chosen
      startAttackChoiceTimer(room.id, room.gameState.pendingAttackWinnerId!);
    } else {
      // Draw or build phase — resolve immediately after brief display
      setTimeout(() => resolveRound(room.id), RESOLVE_DISPLAY_MS);
    }
  });

  socket.on('game:attack_target', (payload: AttackTargetPayload) => {
    const result = rooms.submitAttackTarget(socket.id, payload.target);
    if ('error' in result) {
      socket.emit('room:error', { message: result.error });
      return;
    }

    rooms.clearTimers(result);
    const newState = result.gameState;
    io.to(result.id).emit('game:round_result', {
      result: newState.roundHistory[newState.roundHistory.length - 1],
      gameState: newState,
    });

    if (newState.phase === 'gameover') {
      io.to(result.id).emit('game:over', { winner: newState.winner, gameState: newState });
    } else {
      startTurnTimer(result.id);
    }
  });

  socket.on('room:rematch', (payload: RematchPayload) => {
    const result = rooms.rematch(socket.id);
    if ('error' in result) {
      socket.emit('room:error', { message: result.error });
      return;
    }
    io.to(result.id).emit('room:joined', { gameState: result.gameState });
    setTimeout(() => startTurnTimer(result.id), RESOLVE_DISPLAY_MS);
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    const info = rooms.handleDisconnect(socket.id);
    if (info?.otherSocketId) {
      io.to(info.otherSocketId).emit('player:left', {});
    }
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => console.log(`Server running on :${PORT}`));
