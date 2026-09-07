import { Client } from 'ssh2';

const SSH_CONFIG = {
  host: '103.186.30.230',
  port: 9017,
  username: 'ubuntu',
  password: 'do67@VPS'
};

const PASSWORD = 'do67@VPS';

async function upgradeNode() {
  const conn = new Client();

  conn.on('ready', () => {
    console.log('🔗 Mengunduh script nodesource 22.x...');

    const script = `
export DEBIAN_FRONTEND=noninteractive
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/setup_22.sh
echo '${PASSWORD}' | sudo -S bash /tmp/setup_22.sh
echo '${PASSWORD}' | sudo -S apt-get install -y nodejs
echo "VERIFIKASI NODE VERSION:"
node -v
npm -v
`;

    conn.exec(script, (err, stream) => {
      if (err) {
        console.error('Exec error:', err);
        conn.end();
        return;
      }

      stream.on('close', (code) => {
        console.log(`\n✅ Selesai dengan exit code: ${code}`);
        conn.end();
      }).on('data', (d) => process.stdout.write(d)).stderr.on('data', (d) => process.stderr.write(d));
    });
  }).on('error', (err) => {
    console.error('Error:', err);
  }).connect(SSH_CONFIG);
}

upgradeNode();
