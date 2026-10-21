import type { BalanceConfig } from './schema.js';
import type { DerivedStats, FightEvent, FighterInput } from './types.js';
import type { PRNG } from './prng.js';
import { getValuePerPoint } from './stats.js';

export interface FighterCombatState {
  side: 'A' | 'B';
  input: FighterInput;
  stats: DerivedStats;
  currentHp: number;
  openingStrikeUsed: boolean;
}

export interface StrikeResult {
  event: FightEvent;
  damage: number;
  hit: boolean;
  intimidationHitCap?: boolean;
}

/**
 * Calculates and executes a single strike from attacker to defender.
 * Follows the 8 steps defined in Section 6.2 of GAME_DESIGN.md.
 * All intermediate damage calculations are performed in float;
 * rounding (Math.round) and minimum damage floor of 1 are applied only in Step 8.
 */
export function executeStrike(
  attacker: FighterCombatState,
  defender: FighterCombatState,
  round: number,
  turn: number,
  config: BalanceConfig,
  prng: PRNG
): StrikeResult {
  const attackerStyleConfig = config.styles[attacker.input.style];
  const defenderStyleConfig = config.styles[defender.input.style];

  // STEP 1: Dodge Check
  const isDodge = prng.next() < defender.stats.dodgeChance;

  // Opening Strike is consumed on the attacker's first strike, even if dodged
  let openingStrikeApplies = false;
  let openingStrikeBonus: number | undefined;

  if (attacker.input.style === 'carrasco' && !attacker.openingStrikeUsed) {
    attacker.openingStrikeUsed = true;
    openingStrikeApplies = true;

    const astSelf = attacker.stats.effectiveAstuciaPoints;
    const astTarget = defender.stats.effectiveAstuciaPoints;
    const ratio = (astSelf + astTarget > 0) ? (astSelf / (astSelf + astTarget)) : 0.5;

    const openingCfg = attackerStyleConfig.passives.openingStrike;
    openingStrikeBonus = openingCfg.min + (openingCfg.max - openingCfg.min) * ratio;
  }

  if (isDodge) {
    const event: FightEvent = {
      round,
      turn,
      attacker: attacker.side,
      defender: defender.side,
      isDodge: true,
      isCrit: false,
      openingStrikeBonus,
      finalDamage: 0,
      defenderHpRemaining: defender.currentHp,
    };
    return { event, damage: 0, hit: false };
  }

  // STEP 2: Base Damage
  const valorAtaque = getValuePerPoint('attack', attacker.input.level, config);
  let weaponDamage = 0;
  if (attacker.input.weapon) {
    const { min, max } = attacker.input.weapon;
    if (min > max) {
      throw new Error(`Weapon min damage (${min}) cannot be greater than max (${max})`);
    }
    weaponDamage = prng.int(min, max);
  }

  let damage = (attacker.input.points.attack * valorAtaque + weaponDamage) * attackerStyleConfig.attackScale;

  // STEP 3: Critical Hit Check
  const isCrit = prng.next() < attacker.stats.critChance;
  let critBonusSampled: number | undefined;

  if (isCrit) {
    const [critMin, critMax] = attackerStyleConfig.critBonus;
    critBonusSampled = prng.float(critMin, critMax);
    // Tenacity reduces ONLY the bonus damage: dano * (1 + bonus * (1 - tenacity))
    const effectiveCritMultiplier = 1 + critBonusSampled * (1 - defender.stats.critReduction);
    damage *= effectiveCritMultiplier;
  }

  // STEP 4: Opening Strike (Carrasco)
  if (openingStrikeApplies && openingStrikeBonus !== undefined) {
    damage *= (1 + openingStrikeBonus);
  }

  // STEP 5: Adaptation (Malandro)
  let adaptationBonus: number | undefined;
  if (attacker.input.style === 'malandro') {
    const lifeLostRatio = Math.max(0, 1 - attacker.currentHp / attacker.stats.maxHp);
    const lifeLostPct = lifeLostRatio * 100;
    const adaptRate = config.styles.malandro.passives.adaptationPerPctLifeLost;
    adaptationBonus = adaptRate * lifeLostPct;
    damage *= (1 + adaptationBonus);
  }

  // STEP 6: Armor (Reduction)
  let effectiveArmor = defender.stats.armorReduction;
  if (attacker.input.style === 'carrasco') {
    const ignoreRatio = config.styles.carrasco.passives.executionArmorIgnore;
    effectiveArmor = defender.stats.armorReduction * (1 - ignoreRatio);
  }
  damage *= (1 - effectiveArmor);

  // STEP 7: Intimidation (Muralha Defender in rounds 1, 2, 3)
  let intimidationReductionApplied: number | undefined;
  let intimidationHitCap = false;

  if (defender.input.style === 'muralha' && round <= config.styles.muralha.passives.intimidation.rounds) {
    const intimCfg = config.styles.muralha.passives.intimidation;
    const extraLifePct = Math.max(0, ((defender.stats.maxHp - attacker.stats.maxHp) / attacker.stats.maxHp) * 100);
    const calculatedReduction = intimCfg.base + (extraLifePct / 10) * intimCfg.perTenPctExtraLife;
    const effectiveIntimidation = Math.min(intimCfg.cap, Math.max(intimCfg.base, calculatedReduction));

    intimidationReductionApplied = effectiveIntimidation;
    if (effectiveIntimidation >= intimCfg.cap) {
      intimidationHitCap = true;
    }
    damage *= (1 - effectiveIntimidation);
  }

  // STEP 8: Rounding & Minimum Damage
  const rawDamage = damage;
  const finalDamage = Math.max(config.combat.minDamage, Math.round(damage));
  defender.currentHp = Math.max(0, defender.currentHp - finalDamage);

  const event: FightEvent = {
    round,
    turn,
    attacker: attacker.side,
    defender: defender.side,
    isDodge: false,
    isCrit,
    critBonus: critBonusSampled,
    openingStrikeBonus,
    adaptationBonus,
    armorReductionApplied: effectiveArmor,
    intimidationReductionApplied,
    rawDamage,
    finalDamage,
    defenderHpRemaining: defender.currentHp,
  };

  return { event, damage: finalDamage, hit: true, intimidationHitCap };
}
