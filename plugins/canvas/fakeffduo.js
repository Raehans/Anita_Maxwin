export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

import * as _canvas from '@napi-rs/canvas'
import path from "path";
import config from "../../config.js";
import te from "../../src/lib/anita-error.js";

const pluginConfig = {
  name: "fakeffduo",
  alias: ["fakefreefirduo"],
  category: "canvas",
  description: "Membuat gambar ff",
  usage: ".fakeffduo <text>",
  example: ".fakeffduo Hai cantik",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

let fontRegistered = false;

async function handler(m, { sock }) {
  const nama = m.text?.split("|");
  if (!nama || nama.length < 2) {
    return m.reply(
      `*FAKE FF DUO*\n\n> Contoh: ${m.prefix}fakeffduo nama1|nama2`,
    );
  }
  m.react("🕕");

  if (!fontRegistered) {
    try {
      _canvas.GlobalFonts.registerFromPath(path.join(process.cwd(), "SAMPEL/maker/Teuton.otf"), "TeutonNormal");
      fontRegistered = true;
    } catch (e) {
      console.log("Gagal meload font TeutonNormal:", e);
    }
  }

  try {
    const bgNum = Math.floor(Math.random() * 50) + 1;
    const githubBaseUrl = "https://raw.githubusercontent.com/Raavfy-24/Maker/refs/heads/main";
    const bgUrl = `${githubBaseUrl}/FAKE%20FF%20DUO/${bgNum}.png`;

    const background = await _canvas.loadImage(bgUrl);
    const canvas = _canvas.createCanvas(background.width, background.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.font = `bold 38px "TeutonNormal"`;
    ctx.textAlign = "center";

    const name1 = nama[0].trim();
    const name2 = nama[1].trim();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(name1, 212, canvas.height - 314);
    ctx.fillStyle = "#ffb300";
    ctx.fillText(name1, 212, canvas.height - 314);
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 1.6;
    ctx.strokeText(name1, 212, canvas.height - 314);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(name2, 740, canvas.height - 434);
    ctx.fillStyle = "#ffb300";
    ctx.fillText(name2, 740, canvas.height - 434);
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 1.6;
    ctx.strokeText(name2, 740, canvas.height - 434);

    const buffer = await canvas.encode("png");

    await sock.sendMedia(
      m.chat,
      buffer,
      null,
      m,
      {
        type: "image",
      },
    );

    m.react("✅");
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
