import type { SimulationReport, StyleMatrix } from './analyzer.js';

export function printTerminalReport(report: SimulationReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('       RELATÓRIO DO SIMULADOR DE COMBATE E BALANCEAMENTO (FASE 1)       ');
  console.log('='.repeat(80));
  console.log(`Tempo total medido: ${report.executionTimeMs} ms (${(report.executionTimeMs / 1000).toFixed(2)}s)`);
  console.log(`Lutas por confronto: ${report.configSummary.fightsPerCell.toLocaleString()}`);
  console.log(`Seed base: ${report.configSummary.seed}`);
  console.log('-'.repeat(80));

  // 1. Base 3x3 Matrices per Level
  console.log('\n[1] MATRIZES DE VITÓRIA 3x3 (BUILD EQUILIBRADA)');
  for (const m of report.baseMatrices) {
    console.log(`\n--- NÍVEL ${m.level} ---`);
    console.log('Atacante \ Defensor | Carrasco   | Muralha    | Malandro   |');
    console.log('-------------------+------------+------------+------------+');
    for (const sA of m.styles) {
      const padStyle = (sA.charAt(0).toUpperCase() + sA.slice(1)).padEnd(18);
      const row = m.styles.map(sB => {
        const wr = (m.matrix[sA][sB] * 100).toFixed(1) + '%';
        return wr.padStart(10);
      }).join(' | ');
      console.log(`${padStyle} | ${row} |`);
    }

    // Detail stats table
    console.log('\nDetalhes dos Confrontos no Nível ' + m.level + ':');
    console.log('Confronto            | Vit. A | 1º Atk | Média Rod. | Mediana | P5..P95   | Crit % | Esq % | Intim. Cap % |');
    console.log('---------------------+--------+--------+------------+---------+-----------+--------+-------+--------------+');
    for (const match of m.matchups) {
      const pair = `${match.styleA} x ${match.styleB}`.padEnd(20);
      const wrA = ((match.winRateA * 100).toFixed(1) + '%').padStart(6);
      const fst = ((match.firstAttackerWinRate * 100).toFixed(1) + '%').padStart(6);
      const avgR = match.rounds.avg.toFixed(1).padStart(10);
      const medR = match.rounds.p50.toString().padStart(7);
      const pRange = `${match.rounds.p5}..${match.rounds.p95}`.padStart(9);
      const crit = ((match.observedCritRate * 100).toFixed(1) + '%').padStart(6);
      const dodge = ((match.observedDodgeRate * 100).toFixed(1) + '%').padStart(5);
      const intimCap = ((match.intimidationCapPct * 100).toFixed(1) + '%').padStart(12);

      console.log(`${pair} | ${wrA} | ${fst} | ${avgR} | ${medR} | ${pRange} | ${crit} | ${dodge} | ${intimCap} |`);
    }
  }

  // 2. Level 1 Variation between Rolled Profiles
  console.log('\n' + '-'.repeat(80));
  console.log('[2] VARIAÇÃO ENTRE PERFIS SORTEADOS NO NÍVEL 1 (85 Combinações em Espelho)');
  console.log('Estilo     | Melhor Perfil      | Vit %  | Pior Perfil        | Vit %  | Dispersão | Meta (<5pp) |');
  console.log('-----------+--------------------+--------+--------------------+--------+-----------+-------------+');
  for (const v of report.level1Variations) {
    const st = (v.style.charAt(0).toUpperCase() + v.style.slice(1)).padEnd(10);
    const bCombo = v.bestCombo.padEnd(18);
    const bWr = (v.bestWinRate.toFixed(1) + '%').padStart(6);
    const wCombo = v.worstCombo.padEnd(18);
    const wWr = (v.worstWinRate.toFixed(1) + '%').padStart(6);
    const diff = (v.spreadPctPoints.toFixed(2) + ' pp').padStart(9);
    const status = v.isUnderThreshold ? '   OK (<5%) ' : '  ALERTA (>5%)';
    console.log(`${st} | ${bCombo} | ${bWr} | ${wCombo} | ${wWr} | ${diff} | ${status} |`);
  }

  // 3. Automated Alerts
  console.log('\n' + '-'.repeat(80));
  console.log('[3] ALERTAS AUTOMÁTICOS DE BALANCEAMENTO');
  if (report.alerts.length === 0) {
    console.log('  Nenhum desbalanceamento crítico detectado! Todos os confrontos dentro das metas.');
  } else {
    for (const a of report.alerts) {
      const tag = `[${a.type.toUpperCase()}] (L${a.level})`.padEnd(28);
      console.log(`  ${tag} : ${a.description}`);
    }
  }
  console.log('='.repeat(80) + '\n');
}

export function exportCsvReport(report: SimulationReport): string {
  const lines: string[] = [];
  lines.push('Level,StyleA,BuildA,StyleB,BuildB,TotalFights,WinRateA,FirstAttackerWinRate,RoundsAvg,RoundsMedian,RoundsP5,RoundsP95,CritRate,DodgeRate,IntimidationCapPct');

  for (const matrix of report.baseMatrices) {
    for (const m of matrix.matchups) {
      lines.push([
        m.level,
        m.styleA,
        m.buildA,
        m.styleB,
        m.buildB,
        m.totalFights,
        m.winRateA.toFixed(4),
        m.firstAttackerWinRate.toFixed(4),
        m.rounds.avg,
        m.rounds.p50,
        m.rounds.p5,
        m.rounds.p95,
        m.observedCritRate.toFixed(4),
        m.observedDodgeRate.toFixed(4),
        m.intimidationCapPct.toFixed(4),
      ].join(','));
    }
  }

  return lines.join('\n');
}
