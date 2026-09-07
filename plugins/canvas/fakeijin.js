import { createCanvas } from '@napi-rs/canvas';

const pluginConfig = {
  name: 'fakeijin',
  alias: ['ijinfake', 'suratijin', 'fakeizin'],
  category: 'canvas',
  description: 'Bikin gambar surat izin fiktif untuk konten/gaguan',
  usage: '.fakeijin <nama> | <alasan>',
  example: '.fakeijin Ryo Yamada | Sakit',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true
};

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function generateFakeIjin(nama, alasan) {
  const width = 1200;
  const height = 850;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#eef4ff');
  bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#193a67';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, width - 60, height - 60);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#193a67';
  ctx.font = 'bold 46px "Times New Roman"';
  ctx.fillText('SURAT IZIN', width / 2, 125);
  ctx.font = 'bold 28px "Times New Roman"';
  ctx.fillText('DOKUMEN FIKTIF • UNTUK KONTEN', width / 2, 170);

  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 195);
  ctx.lineTo(950, 195);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#222';
  ctx.font = '28px "Times New Roman"';
  ctx.fillText('Dengan ini menerangkan bahwa:', 150, 265);
  ctx.font = 'bold 34px "Times New Roman"';
  ctx.fillText(String(nama).toUpperCase(), 150, 325);
  ctx.font = '28px "Times New Roman"';
  ctx.fillText(`diberikan izin dengan alasan: ${String(alasan).toUpperCase()}`, 150, 390);

  roundedRect(ctx, 120, 445, 960, 105, 16);
  ctx.fillStyle = '#f4f7fb';
  ctx.fill();
  ctx.strokeStyle = '#d6deea';
  ctx.stroke();
  ctx.fillStyle = '#193a67';
  ctx.font = 'bold 27px "Times New Roman"';
  ctx.fillText('Tanggal', 165, 488);
  ctx.font = '25px "Times New Roman"';
  ctx.fillStyle = '#222';
  ctx.fillText(new Date().toLocaleDateString('id-ID'), 165, 528);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#555';
  ctx.font = '20px "Times New Roman"';
  ctx.fillText('Contoh/gaguan saja — bukan dokumen resmi', width / 2, 735);
  ctx.fillStyle = '#193a67';
  ctx.font = 'bold 25px "Times New Roman"';
  ctx.fillText('Ryo Yamada MD', width / 2, 780);

  return canvas.toBuffer('image/png');
}

async function handler(m, { sock }) {
  const text = m.args.join(' ') || m.text?.trim() || '';
  if (!text) return m.reply(`*Cara pakai:*\n${m.prefix}fakeijin <nama> | <alasan>\nContoh: .fakeijin Ryo Yamada | Sakit`);

  const [nama = 'Darling', alasan = 'Sakit'] = text.split('|').map(v => v.trim());
  await m.react('💕');
  await m.reply('⏳ *Processing...*');

  try {
    const image = generateFakeIjin(nama, alasan);
    await sock.sendMessage(m.chat, {
      image,
      caption: `💕 *FAKE SURAT IJIN* 💕\n\nNama: ${nama}\nAlasan: ${alasan}\n\n_Dokumen fiktif untuk konten._`
    }, { quoted: m });
    await m.react('✅');
  } catch (err) {
    await m.react('💔');
    return m.reply(`❌ Gagal membuat gambar: ${err.message}`);
  }
}

export { pluginConfig as config, handler };
