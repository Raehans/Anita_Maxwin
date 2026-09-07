/**
 * anita-session-persistence.js
 * Module untuk backup dan restore session WA Baileys dari/ke env var Base64.
 * Didesain untuk platform cloud ephemeral seperti Deepnote.
 */

import fs from 'fs';
import path from 'path';
import { logger } from './anita-logger.js';

const SESSION_ENV_KEY = 'ANITA_SESSION_B64';
const SESSION_DIR = path.join(process.cwd(), 'storage', 'session');

// ─── RESTORE: env var → folder session/ ───────────────────────────────────

export async function restoreSessionFromEnv() {
  const b64 = process.env[SESSION_ENV_KEY];

  if (!b64 || b64.trim() === '') {
    logger.info('session-persistence', 'Tidak ada ANITA_SESSION_B64 - session baru akan dibuat');
    return false;
  }

  logger.info('session-persistence', 'Ditemukan ANITA_SESSION_B64 - memulai restore session...');

  try {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const zipPath = path.join(tmpDir, '_session_restore.zip');
    const zipBuffer = Buffer.from(b64.trim(), 'base64');
    fs.writeFileSync(zipPath, zipBuffer);

    logger.info('session-persistence', Mengekstrak session ( KB)...);

    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(SESSION_DIR, true);

    fs.unlinkSync(zipPath);

    const files = fs.readdirSync(SESSION_DIR);
    logger.success('session-persistence', Session berhasil di-restore! ( file));
    return true;
  } catch (error) {
    logger.error('session-persistence', Gagal restore session: );
    logger.warn('session-persistence', 'Bot akan memulai session baru (perlu pairing ulang)');
    return false;
  }
}

// ─── BACKUP: folder session/ → Base64 ────────────────────────────────────

let _lastBackupHash = null;
let _backupDebounceTimer = null;

export async function backupSessionToEnv() {
  if (_backupDebounceTimer) clearTimeout(_backupDebounceTimer);
  _backupDebounceTimer = setTimeout(async () => {
    _backupDebounceTimer = null;
    await _doBackup();
  }, 3000);
}

async function _doBackup() {
  if (!fs.existsSync(SESSION_DIR)) return;
  const files = fs.readdirSync(SESSION_DIR);
  if (files.length === 0) return;

  try {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const zipPath = path.join(tmpDir, '_session_backup.zip');
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();

    for (const file of files) {
      const fullPath = path.join(SESSION_DIR, file);
      if (fs.statSync(fullPath).isFile()) zip.addLocalFile(fullPath);
    }

    zip.writeZip(zipPath);
    const zipBuffer = fs.readFileSync(zipPath);
    const b64 = zipBuffer.toString('base64');

    const hash = b64.slice(-32);
    if (hash === _lastBackupHash) return;
    _lastBackupHash = hash;
    fs.unlinkSync(zipPath);

    const sizeKB = (b64.length / 1024).toFixed(1);
    logger.success('session-persistence', Session backup berhasil! ( KB));

    if (_isOnDeepnote()) {
      const sep = '='.repeat(70);
      console.log(\n);
      console.log('ANITA_SESSION_B64 - COPY KE DEEPNOTE ENV VARS:');
      console.log(sep);
      console.log(b64);
      console.log(sep);
      console.log('Deepnote > Project > Environment Variables > ANITA_SESSION_B64\n');
    }
  } catch (error) {
    logger.error('session-persistence', Gagal backup session: );
  }
}

function _isOnDeepnote() {
  return !!(
    process.env.DEEPNOTE_PROJECT_ID ||
    process.env.DEEPNOTE_KERNEL_ID ||
    process.env.DEEPNOTE ||
    process.env.SESSION_PERSISTENCE_FORCE_PRINT
  );
}

export function printSessionPersistenceInfo() {
  if (!_isOnDeepnote()) return;
  const hasSession = !!(process.env[SESSION_ENV_KEY]);
  const sep = '-'.repeat(60);
  console.log(\n);
  console.log('SESSION PERSISTENCE MODE (Deepnote)');
  console.log(sep);
  if (hasSession) {
    console.log('ANITA_SESSION_B64 ditemukan - session akan di-restore (tidak perlu pairing ulang!)');
  } else {
    console.log('ANITA_SESSION_B64 belum diset - perlu pairing pertama kali.');
    console.log('Setelah connected, copy Base64 di log ke env var ANITA_SESSION_B64.');
  }
  console.log(${sep}\n);
}
