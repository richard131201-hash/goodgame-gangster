import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import balanceJson from '../../config/balance.config.json' with { type: 'json' };
import { validateConfig } from '../engine/schema.js';
import { runFullSimulation } from './analyzer.js';
import { printTerminalReport, exportCsvReport } from './reporters.js';

function main() {
  const args = parseArgs({
    options: {
      fights: { type: 'string', default: '100000' },
      levels: { type: 'string', default: '1,10,50,100' },
      seed: { type: 'string', default: '42' },
      outDir: { type: 'string', default: 'output' },
      csv: { type: 'boolean', default: true },
      json: { type: 'boolean', default: true },
    },
    allowPositionals: true,
  });

  const fights = parseInt(args.values.fights ?? '100000', 10);
  const levels = (args.values.levels ?? '1,10,50,100')
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n));
  const seed = parseInt(args.values.seed ?? '42', 10);
  const outDir = path.resolve(process.cwd(), args.values.outDir ?? 'output');

  const config = validateConfig(balanceJson);

  console.log(`Iniciando simulador com ${fights.toLocaleString()} lutas por célula...`);
  console.log(`Níveis analisados: ${levels.join(', ')} | Seed base: ${seed}`);

  const report = runFullSimulation(levels, fights, seed, config);

  // Print Terminal Report
  printTerminalReport(report);

  // Save outputs if requested
  if (args.values.csv || args.values.json) {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    if (args.values.json) {
      const jsonPath = path.join(outDir, 'simulation_report.json');
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`Relatório JSON exportado em: ${jsonPath}`);
    }

    if (args.values.csv) {
      const csvPath = path.join(outDir, 'simulation_matchups.csv');
      fs.writeFileSync(csvPath, exportCsvReport(report), 'utf-8');
      console.log(`Tabela CSV exportada em: ${csvPath}`);
    }
  }
}

main();
