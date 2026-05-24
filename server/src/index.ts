import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  Gesture,
  CreateRoomPayload,
  JoinRoomPayload,
  GesturePayload,
  WeaponDrawingPayload,
  RematchPayload,
  TURN_TIMEOUT_MS,
  RESOLVE_DISPLAY_MS,
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

function startTurnTimer(roomId: string) {
  const room = rooms.getRoom(roomId);
  if (!room) return;
  rooms.setTimer(room, setTimeout(() => {
    const r = rooms.getRoom(roomId);
    if (!r || r.gameState.phase !== 'choosing') return;
    rooms.forceGesture(roomId, randomGesture);
    io.to(roomId).emit('game:timeout', { gameState: r.gameState });
    resolveRound(roomId);
  }, TURN_TIMEOUT_MS));
}

function resolveRound(roomId: string) {
  const newState = rooms.applyRound(roomId);
  io.to(roomId).emit('game:round_result', {
    result: newState.roundHistory[newState.roundHistory.length - 1],
    gameState: newState,
  });
  if (newState.phase === 'gameover') {
    io.to(roomId).emit('game:over', { winner: newState.winner, gameState: newState });
  } else {
    startTurnTimer(roomId);
  }
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
    if ('error' in result) { socket.emit('room:error', { message: result.error }); return; }
    socket.join(result.id);
    io.to(result.id).emit('room:joined', { gameState: result.gameState });
    setTimeout(() => startTurnTimer(result.id), RESOLVE_DISPLAY_MS);
  });

  socket.on('game:gesture', (payload: GesturePayload) => {
    const result = rooms.submitGesture(socket.id, payload.gesture);
    if ('error' in result) { socket.emit('room:error', { message: result.error }); return; }
    const { room, bothReady } = result;
    if (!bothReady) {
      socket.to(room.id).emit('game:opponent_chose', {});
      return;
    }
    rooms.clearTimers(room);
    setTimeout(() => resolveRound(room.id), RESOLVE_DISPLAY_MS);
  });

  socket.on('game:weapon_drawing', (payload: WeaponDrawingPayload) => {
    const result = rooms.setWeaponDrawing(socket.id, payload.drawingPath);
    if ('error' in result) { socket.emit('room:error', { message: result.error }); return; }
    io.to(result.id).emit('game:state_update', { gameState: result.gameState });
  });

  socket.on('room:rematch', (payload: RematchPayload) => {
    const result = rooms.rematch(socket.id);
    if ('error' in result) { socket.emit('room:error', { message: result.error }); return; }
    io.to(result.id).emit('room:joined', { gameState: result.gameState });
    setTimeout(() => startTurnTimer(result.id), RESOLVE_DISPLAY_MS);
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    const info = rooms.handleDisconnect(socket.id);
    if (info?.otherSocketId) io.to(info.otherSocketId).emit('player:left', {});
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => console.log(`Server running on :${PORT}`));
