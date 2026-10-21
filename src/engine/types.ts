export type StyleId = 'carrasco' | 'muralha' | 'malandro';

export interface Points {
  attack: number;
  life: number;
  astucia: number;
  tenacidade: number;
}

export interface Weapon {
  min: number;
  max: number;
}

export interface FighterInput {
  style: StyleId;
  level: number; // 1 a 100
  points: Points; // pontos totais já distribuídos
  weapon?: Weapon; // opcional, padrão { min: 0, max: 0 }
}

export interface DerivedStats {
  maxHp: number;
  attackPower: number;
  effectiveAstuciaPoints: number;
  effectiveTenacidadePoints: number;
  critChance: number; // 0.0 a 0.50 (teto de 50%)
  critReduction: number; // 0.0 a 0.50 (teto de 50%)
  armorReduction: number; // fixo por estilo
  dodgeChance: number; // fixo por estilo
}

export interface FightEvent {
  round: number;
  turn: number;
  attacker: 'A' | 'B';
  defender: 'A' | 'B';
  isDodge: boolean;
  isCrit: boolean;
  critBonus?: number;
  openingStrikeBonus?: number;
  adaptationBonus?: number;
  armorReductionApplied?: number;
  intimidationReductionApplied?: number;
  rawDamage?: number;
  finalDamage: number;
  defenderHpRemaining: number;
}

export interface FightResult {
  winner: 'A' | 'B';
  rounds: number;
  firstAttacker: 'A' | 'B';
  finalHp: { A: number; B: number };
  events?: FightEvent[];
}
