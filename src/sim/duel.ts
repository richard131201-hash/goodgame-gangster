import { parseArgs } from 'node:util';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig } from '../engine/schema.js';
import { simulateFight } from '../engine/fight.js';
import { getBuildPoints, type BuildType } from './builds.js';
import type { StyleId, FighterInput } from '../engine/types.js';

function main() {
  const args = parseArgs({
    options: {
      styleA: { type: 'string', default: 'carrasco' },
      buildA: { type: 'string', default: 'equilibrado' },
      styleB: { type: 'string', default: 'muralha' },
      buildB: { type: 'string', default: 'equilibrado' },
      level: { type: 'string', default: '1' },
      seed: { type: 'string', default: '42' },
    },
    allowPositionals: true,
  });

  const config = validateConfig(balanceJson);
  const styleA = (args.values.styleA ?? 'carrasco') as StyleId;
  const buildA = (args.values.buildA ?? 'equilibrado') as BuildType;
  const styleB = (args.values.styleB ?? 'muralha') as StyleId;
  const buildB = (args.values.buildB ?? 'equilibrado') as BuildType;
  const level = parseInt(args.values.level ?? '1', 10);
  const seed = args.values.seed ?? '42';

  const fighterA: FighterInput = {
    style: styleA,
    level,
    points: getBuildPoints(buildA, level, config),
  };

  const fighterB: FighterInput = {
    style: styleB,
    level,
    points: getBuildPoints(buildB, level, config),
  };

  console.log('\n' + '='.repeat(70));
  console.log(`DUELO 1v1: ${styleA.toUpperCase()} (L${level}, ${buildA}) VS ${styleB.toUpperCase()} (L${level}, ${buildB})`);
  console.log(`Seed do combate: ${seed}`);
  console.log('='.repeat(70));

  const result = simulateFight(fighterA, fighterB, config, seed, { withEvents: true });

  console.log(`\nIniciativa: Lutador ${result.firstAttacker} (${result.firstAttacker === 'A' ? styleA : styleB}) ataca primeiro!\n`);

  for (const ev of result.events ?? []) {
    const atkStyle = ev.attacker === 'A' ? styleA : styleB;
    const defStyle = ev.defender === 'A' ? styleA : styleB;

    let details = '';
    if (ev.isDodge) {
      details = '>> ESQUIVOU! (Sem dano)';
    } else {
      const parts: string[] = [];
      if (ev.isCrit) parts.push(`CRÍTICO (+${((ev.critBonus ?? 0) * 100).toFixed(0)}%)`);
      if (ev.openingStrikeBonus) parts.push(`ABERTURA (+${((ev.openingStrikeBonus) * 100).toFixed(0)}%)`);
      if (ev.adaptationBonus) parts.push(`ADAPTAÇÃO (+${((ev.adaptationBonus) * 100).toFixed(1)}%)`);
      if (ev.armorReductionApplied) parts.push(`Armadura -${((ev.armorReductionApplied) * 100).toFixed(1)}%`);
      if (ev.intimidationReductionApplied) parts.push(`Intimidação -${((ev.intimidationReductionApplied) * 100).toFixed(1)}%`);

      details = `Dano: ${ev.finalDamage} [${parts.join(', ')}] -> HP restante: ${ev.defenderHpRemaining}`;
    }

    console.log(`[R${ev.round} T${ev.turn}] ${atkStyle} atacou ${defStyle} -> ${details}`);
  }

  console.log('\n' + '-'.repeat(70));
  const winnerStyle = result.winner === 'A' ? styleA : styleB;
  console.log(`VENCEDOR: Lutador ${result.winner} (${winnerStyle.toUpperCase()}) em ${result.rounds} rodadas!`);
  console.log(`HP Final: ${styleA} = ${result.finalHp.A} | ${styleB} = ${result.finalHp.B}`);
  console.log('='.repeat(70) + '\n');
}

main();
