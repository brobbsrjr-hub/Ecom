import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { buildPromoVariables, PromoOptions, PromoProduct, PromoRow } from './promoVariables';

export const TEMPLATE_DIR = path.resolve(__dirname, '../../video/product-promo');

/** An input entry: either a bare product, or `{ product, promo }` with per-product options. */
export type PromoInput = PromoProduct | { product: PromoProduct; promo?: PromoOptions };

export function toRows(inputs: PromoInput[], defaults: PromoOptions = {}): PromoRow[] {
  const rows = inputs.map(entry => {
    const { product, promo } = 'product' in entry ? entry : { product: entry, promo: undefined };
    return buildPromoVariables(product, { ...defaults, ...promo });
  });

  const seen = new Set<string>();
  for (const row of rows) {
    if (!/^[A-Za-z0-9_.-]+$/.test(row.name)) {
      throw new Error(`Product slug "${row.name}" can't be used as a filename (letters, digits, _ . - only)`);
    }
    if (seen.has(row.name)) throw new Error(`Duplicate product slug: ${row.name}`);
    seen.add(row.name);
  }
  return rows;
}

interface CliArgs {
  input: string;
  out: string;
  quality: string;
  dryRun: boolean;
  defaults: PromoOptions;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    input: '',
    out: 'video/renders',
    quality: 'looks',
    dryRun: false,
    defaults: {},
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`Missing value for ${flag}`);
      return value;
    };
    switch (flag) {
      case '--out': args.out = next(); break;
      case '--quality': args.quality = next(); break;
      case '--shop-url': args.defaults.shopUrl = next(); break;
      case '--currency': args.defaults.currency = next(); break;
      case '--accent': args.defaults.accent = next(); break;
      case '--dry-run': args.dryRun = true; break;
      default:
        if (flag.startsWith('--')) throw new Error(`Unknown option: ${flag}`);
        args.input = flag;
    }
  }
  if (!args.input) {
    throw new Error(
      'Usage: npm run video:render -- <products.json> [--out dir] [--quality draft|looks|delivery] ' +
        '[--shop-url url] [--currency USD] [--accent #hex] [--dry-run]'
    );
  }
  return args;
}

export function main(argv: string[]): number {
  const args = parseArgs(argv);
  const inputs = JSON.parse(fs.readFileSync(args.input, 'utf8')) as PromoInput[];
  if (!Array.isArray(inputs)) throw new Error(`${args.input} must contain a JSON array`);

  const outDir = path.resolve(args.out);
  fs.mkdirSync(outDir, { recursive: true });
  const rowsPath = path.join(outDir, 'rows.json');
  fs.writeFileSync(rowsPath, JSON.stringify({ rows: toRows(inputs, args.defaults) }, null, 2));
  console.log(`Wrote ${inputs.length} row(s) to ${rowsPath}`);
  if (args.dryRun) return 0;

  const result = spawnSync(
    'npx',
    [
      'hyperframes', 'render',
      '--batch', rowsPath,
      '--output', path.join(outDir, '{name}.mp4'),
      '--quality', args.quality,
      '--strict-variables',
    ],
    { cwd: TEMPLATE_DIR, stdio: 'inherit' }
  );
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
