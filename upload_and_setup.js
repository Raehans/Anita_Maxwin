import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { Client } from 'ssh2';

const SSH_CONFIG = {
  host: process.env.VPS_HOST || '103.186.30.230',
  port: parseInt(process.env.VPS_PORT || '9017'),
  username: process.env.VPS_USER || 'ubuntu',
  password: process.env.VPS_PASSWORD,
};

if (!process.env.VPS_PASSWORD) {
  console.error('❌ VPS_PASSWORD env var tidak diset! Jalankan dengan:\n   VPS_PASSWORD=xxx node upload_and_setup.js');
  process.exit(1);
}

const ZIP_PATH = path.join(process.cwd(), 'ryo-bot-deploy.zip');
const REMOTE_DIR = '/home/ubuntu/ryo-bot';
const REMOTE_ZIP = '/home/ubuntu/ryo-bot-deploy.zip';

async function createZip() {
  console.log('📦 Mengompres file proyek (mengecualikan node_modules, session, tmp)...');
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ Zip berhasil dibuat: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve();
    });

    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    archive.glob('**/*', {
      cwd: process.cwd(),
      ignore: [
        'node_modules/**',
        'node_modules',
        'session/**',
        'session',
        'session_voip/**',
        'session_voip',
        'tmp/**',
        'tmp',
        '*.zip',
        '.git/**',
        '.git',
        '.agents/**',
        '.gemini/**'
      ],
      dot: true
    });

    archive.finalize();
  });
}

async function uploadAndExtract() {
  const conn = new Client();

  return new Promise((resolve, reject) => {
    conn.on('ready', () => {
      console.log('🔗 Terhubung ke VPS Ubuntu via SSH...');

      conn.sftp((err, sftp) => {
        if (err) return reject(err);

        console.log('📤 Mengunggah file zip ke VPS...');
        const readStream = fs.createReadStream(ZIP_PATH);
        const writeStream = sftp.createWriteStream(REMOTE_ZIP);

        writeStream.on('close', () => {
          console.log('✅ File zip berhasil diunggah ke VPS!');

          console.log('📂 Mengekstrak file di server VPS...');
          const cmd = `mkdir -p ${REMOTE_DIR} && unzip -o -q ${REMOTE_ZIP} -d ${REMOTE_DIR} && rm ${REMOTE_ZIP} && cd ${REMOTE_DIR} && chmod +x setup_vps.sh && ls -la ${REMOTE_DIR}`;

          conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);

            stream.on('close', (code) => {
              console.log(`✅ File berhasil diekstrak! (Exit code: ${code})`);
              conn.end();
              if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
              resolve();
            }).on('data', (data) => {
              process.stdout.write(data);
            }).stderr.on('data', (data) => {
              process.stderr.write(data);
            });
          });
        });

        readStream.pipe(writeStream);
      });
    }).on('error', (err) => {
      reject(err);
    }).connect(SSH_CONFIG);
  });
}

async function run() {
  try {
    await createZip();
    await uploadAndExtract();
    console.log('\n🎉 UPLOAD SELESAI DENGAN SUKSES!');
  } catch (error) {
    console.error('❌ Error:', error);
    if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
  }
}

run();
