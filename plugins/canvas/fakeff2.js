import axios from 'axios';

const pluginConfig = {
  name: 'fakeff2',
  alias: ['fakefreefire2'],
  category: 'canvas',
  description: 'Membuat gambar fake Free Fire',
  usage: '.fakeff2 <text>',
  example: '.fakeff2 Hai cantik',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true
};

const API_URL = 'https://api.nexray.web.id/maker/fakelobyff';

async function handler(m, { sock }) {
  const body = m.body || m.text || '';
  const nama = body.trim().split(' ').slice(1).join(' ').trim();

  if (!nama) return m.reply(`🎮 *FAKE FF 2*\n\nContoh:\n${pluginConfig.example}`);

  await m.react('🕕');
  try {
    const url = `${API_URL}?nickname=${encodeURIComponent(nama)}`;
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { Accept: 'image/*' },
      validateStatus: status => status >= 200 && status < 300
    });

    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      throw new Error(`API mengembalikan ${contentType || 'data non-image'}`);
    }

    await sock.sendMessage(m.chat, {
      image: Buffer.from(response.data),
      caption: `🔥 *FAKE FREE FIRE 2*\n\n👤 Nama: ${nama}\n\n_Dibuat untuk konten._`
    }, { quoted: m });

    await m.react('✅');
  } catch (e) {
    console.error('[FakeFF2] Error:', e.response?.status || e.message);
    await m.react('❌');
    return m.reply(`❌ *FakeFF2 gagal*\n\n${e.response?.status ? `HTTP ${e.response.status}` : e.message}`);
  }
}

export { pluginConfig as config, handler };
