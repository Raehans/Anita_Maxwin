import { Client } from 'ssh2';

const SSH_CONFIG = {
  host: process.env.VPS_HOST || '103.186.30.230',
  port: parseInt(process.env.VPS_PORT || '9017'),
  username: process.env.VPS_USER || 'ubuntu',
  password: process.env.VPS_PASSWORD,
};

const PASSWORD = process.env.VPS_PASSWORD;

if (!PASSWORD) {
  console.error('❌ VPS_PASSWORD env var tidak diset! Jalankan dengan:\n   VPS_PASSWORD=xxx node remote_setup.js');
  process.exit(1);
}

async function runRemoteSetup() {
  const conn = new Client();

  conn.on('ready', () => {
    console.log('🔗 Terhubung ke VPS via SSH!');
    
    // Non-interactive script
    const script = `
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

echo '${PASSWORD}' | sudo -S sed -i "s/#\\$nrconf{restart} = 'i';/\\$nrconf{restart} = 'a';/g" /etc/needrestart/needrestart.conf 2>/dev/null || true
echo '${PASSWORD}' | sudo -S sed -i "s/#\\$nrconf{kernelhints} = -1;/\\$nrconf{kernelhints} = 0;/g" /etc/needrestart/needrestart.conf 2>/dev/null || true

echo '${PASSWORD}' | sudo -S -E apt update -y
echo '${PASSWORD}' | sudo -S -E apt install -y -q unzip curl git build-essential ffmpeg imagemagick webp tesseract-ocr tesseract-ocr-ind pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

mkdir -p /home/ubuntu/ryo-bot
if [ -f /home/ubuntu/ryo-bot-deploy.zip ]; then
  unzip -o -q /home/ubuntu/ryo-bot-deploy.zip -d /home/ubuntu/ryo-bot
  rm /home/ubuntu/ryo-bot-deploy.zip
fi

cd /home/ubuntu/ryo-bot

# Install Node.js 22 LTS
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | echo '${PASSWORD}' | sudo -S -E bash -
  echo '${PASSWORD}' | sudo -S -E apt install -y -q nodejs
fi

echo '${PASSWORD}' | sudo -S npm install -g pm2
npm install

echo ""
echo "=================================================="
echo "🎉 SETUP BOT DI VPS SELESAI!"
echo "Node version : $(node -v)"
echo "NPM version  : $(npm -v)"
echo "PM2 version  : $(pm2 -v)"
echo "Lokasi Bot   : /home/ubuntu/ryo-bot"
echo "=================================================="
`;

    conn.exec(script, (err, stream) => {
      if (err) {
        console.error('Exec error:', err);
        conn.end();
        return;
      }

      stream.on('close', (code, signal) => {
        console.log(`\n✅ Remote setup selesai dengan exit code: ${code}`);
        conn.end();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }).on('error', (err) => {
    console.error('❌ SSH Connection Error:', err);
  }).connect(SSH_CONFIG);
}

runRemoteSetup();
