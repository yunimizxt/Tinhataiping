export type Gesture = 'rock' | 'paper' | 'scissors';

export type AttackTarget =
  | 'base'      // outermost layer: shield → flag → fortress character
  | 'cannon'    // destroy opponent's cannon
  | 'aircraft'; // destroy opponent's aircraft

export type HitResult = 'shield' | 'flag' | 'fortress' | 'cannon' | 'aircraft';

export type GamePhase =
  | 'waiting'        // room created, awaiting opponent
  | 'choosing'       // both choosing gesture (10s)
  | 'resolving'      // brief reveal of both gestures
  | 'attack_choice'  // winner in attack phase picks target (3s)
  | 'gameover';

export type RoundOutcome = 'p1_wins' | 'p2_wins' | 'draw';

export type ProgressEvent =
  | { type: 'built_flag' }
  | { type: 'built_shield' }
  | { type: 'built_cannon' }
  | { type: 'built_aircraft' }
  | { type: 'repaired_flag' }
  | { type: 'repaired_shield' }
  | { type: 'attacked'; target: AttackTarget; hit: HitResult };

export interface PlayerState {
  id: string;
  name: string;
  fortressHp: number;   // 0-4, the 天下太平 characters remaining
  flags: number;        // 0-3
  shields: number;      // 0-2 (requires flags === 3)
  hasCannon: boolean;   // requires flags === 3 && shields === 2
  hasAircraft: boolean; // requires flags === 3 && shields === 2
  gesture: Gesture | null;
  hasChosen: boolean;   // visible to opponent (not the gesture value)
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
  pendingAttackWinnerId: string | null; // set during attack_choice phase
  roundHistory: RoundResult[];
  winner: string | null; // player id of winner
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

export interface AttackTargetPayload {
  roomId: string;
  target: AttackTarget;
}

export interface RematchPayload {
  roomId: string;
}
