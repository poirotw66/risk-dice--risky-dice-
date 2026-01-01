export enum DiceOutcome {
  IDLE = 'IDLE',
  ROLLING = 'ROLLING',
  GREAT_FORTUNE = 'GREAT_FORTUNE', // 大吉
  GREAT_MISFORTUNE = 'GREAT_MISFORTUNE' // 大凶
}

export interface GameState {
  streak: number; // Current accumulated luck
  totalRolls: number;
  outcome: DiceOutcome;
  maxStreak: number;
}
