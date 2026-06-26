import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(process.env.LOG_DIR || path.join(__dirname, 'logs'));
const MAX_AGE_DAYS = 7;

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `${date}.log`);
}

function cleanOldLogs() {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
    for (const f of files) {
      const fp = path.join(LOG_DIR, f);
      const stat = fs.statSync(fp);
      if (stat.isFile() && stat.mtimeMs < cutoff) fs.unlinkSync(fp);
    }
  } catch {}
}

export function log(level, message) {
  ensureDir();
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
  const line = `[${ts}] [${level}] ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(getLogFile(), line + '\n');
  } catch {}
  if (level === 'INFO') cleanOldLogs();
}

export const logger = {
  info: (msg) => log('INFO', msg),
  error: (msg) => log('ERROR', msg),
  warn: (msg) => log('WARN', msg),
};
