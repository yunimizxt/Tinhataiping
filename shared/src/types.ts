export type Gesture = 'rock' | 'paper' | 'scissors';

export type HitResult = 'shield' | 'flag' | 'fortress';

export type GamePhase =
  | 'waiting'       // room created, awaiting opponent
  | 'drawing'       // winner is drawing their weapon (local only)
  | 'choosing'      // both choosing gesture (10s)
  | 'resolving'     // brief reveal of both gestures
  | 'gameover';

export type RoundOutcome = 'p1_wins' | 'p2_wins' | 'draw';

export type AttackChoice = 'attack' | 'add_defense' | 'new_weapon';

export type ProgressEvent =
  | { type: 'built_flag' }
  | { type: 'built_shield' }
  | { type: 'built_weapon' }
  | { type: 'repaired_flag' }
  | { type: 'repaired_shield' }
  | { type: 'repaired_fortress' }
  | { type: 'extra_defense' }
  | { type: 'attacked'; hit: HitResult };

export interface PlayerState {
  id: string;
  name: string;
  fortressHp: number;      // 0-4, the 天下太平 characters remaining
  flags: number;           // 0-3
  shields: number;         // 0-2 (requires flags === 3)
  hasWeapon: boolean;      // requires flags === 3 && shields === 2; drawn freehand
  weaponDrawing: string | null; // SVG path data of the drawn weapon
  gesture: Gesture | null;
  hasChosen: boolean;      // visible to opponent (not the gesture value)
}

export interface RoundResult {
  round: number;
  p1Gesture: Gesture;
  p2Gesture: Gesture;
  outcome: RoundOutcome;
  p1Progress: ProgressEvent | null;
  p2Progress: ProgressEvent | null;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  round: number;
  p1: PlayerState;
  p2: PlayerState;
  roundHistory: RoundResult[];
  winner: string | null;
}

// Socket payload types
export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
}

export interface GesturePayload {
  roomId: string;
  gesture: Gesture;
}

export interface WeaponDrawingPayload {
  roomId: string;
  drawingPath: string;
}

export interface RematchPayload {
  roomId: string;
}
