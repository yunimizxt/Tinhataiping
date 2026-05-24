export const FORTRESS_MAX_HP = 4;
export const MAX_FLAGS = 3;
export const MAX_SHIELDS = 2;
export const TURN_TIMEOUT_MS = 10_000;
export const RESOLVE_DISPLAY_MS = 1_500;
export const ATTACK_CHOICE_TIMEOUT_MS = 5_000;
export const ROOM_CODE_LENGTH = 4;

// Characters in order — removed right-to-left (平 first, then 太, 下, 天)
export const FORTRESS_CHARS = ['天', '下', '太', '平'] as const;
