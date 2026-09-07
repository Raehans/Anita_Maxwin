import { Client } from 'ssh2';

const SSH_CONFIG = {
  host: '103.186.30.230',
  port: 9017,
  username: 'ubuntu',
  password: 'do67@VPS'
};

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`sed -i 's/^simport/import/' /home/ubuntu/ryo-bot/config.js && head -n 5 /home/ubuntu/ryo-bot/config.js`, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect(SSH_CONFIG);
