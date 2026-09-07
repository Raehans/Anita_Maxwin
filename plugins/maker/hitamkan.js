export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

import axios from "axios";
import config from "../../config.js";

const pluginConfig = {
  name: "xterm-maker-edit",
  alias: [
    "hitamkan", "irengkan", "irengin", "putihkan", "putihin",
    "merahkan", "merahin", "orenkan", "orenin", "kuningkan", "kuningin",
    "hijaukan", "hijauin", "birukan", "boruin", "ungukan", "unguin",
    "gelapkan", "gelapin", "jadibiru", "silverkan", "silverin", "manusiasilver",
    "emaskan", "goldkan", "manusiaemas", "ironman", "avatar", "na'vi", "navikan",
    "hulk", "hulkkan", "jadihulk", "zombie", "zombiefy", "jadi-zombie",
    "cyborg", "robotkan", "tofigur", "jadifigur"
  ],
  category: "maker",
  description: "AI image maker/editor memakai API XTerm/Termai",
  usage: ".irengkan (reply gambar)",
  example: ".irengkan",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  energi: 15,
  isEnabled: true,
};

const promptMap = new Map([
  ...["hitamkan", "irengkan", "irengin"].map(k => [k, "change skin color to black"]),
  ...["putihkan", "putihin"].map(k => [k, "change skin color to white"]),
  ...["merahkan", "merahin"].map(k => [k, "change skin color to red"]),
  ...["orenkan", "orenin"].map(k => [k, "change skin color to orange"]),
  ...["kuningkan", "kuningin"].map(k => [k, "change skin color to yellow"]),
  ...["hijaukan", "hijauin"].map(k => [k, "change skin color to green"]),
  ...["birukan", "boruin", "jadibiru"].map(k => [k, "change skin color to blue"]),
  ...["ungukan", "unguin"].map(k => [k, "change skin color to purple"]),
  ...["gelapkan", "gelapin"].map(k => [k, "change skin color to dark"]),
  ...["silverkan", "silverin", "manusiasilver"].map(k => [k, "change skin color to metallic silver, reflective silver body paint texture, highly detailed metallic sheen"]),
  ...["emaskan", "goldkan", "manusiaemas"].map(k => [k, "change skin color to shiny metallic gold, reflective gold paint, statuesque appearance, luxury gold texture"]),
  ["ironman", "edit the image into Iron Man suit, keep the original face highly accurate, detailed metallic armor, glowing arc reactor, realistic cinematic style"],
  ...["avatar", "na'vi", "navikan"].map(k => [k, "convert into Avatar Na'vi character, glowing neon blue skin with faint stripes, bioluminescent dots, yellow eyes, braided hair, Pandora jungle background"]),
  ...["hulk", "hulkkan", "jadihulk"].map(k => [k, "convert into Hulk style, giant muscular build, green skin, angry expression, ripped clothes, realistic cinematic look"]),
  ...["zombie", "zombiefy", "jadi-zombie"].map(k => [k, "convert into a realistic zombie, pale decaying skin, cinematic horror lighting, dramatic shadows, post-apocalyptic background"]),
  ...["cyborg", "robotkan"].map(k => [k, "convert into cyberpunk cyborg style, mechanical parts integrated into skin, glowing neon LED lines, futuristic clothing, synthwave city background"]),
  ...["tofigur", "jadifigur"].map(k => [k, "illustration of a 1/7 scale figure, highly detailed and realistic, on a computer desk with a transparent acrylic base, 3D modeling screen, photorealistic"]),
]);

async function handler(m, { sock }) {
  const image = m.isImage ? await m.download() : m.quoted?.isImage || m.quoted?.type === "imageMessage" ? await m.quoted.download() : null;
  if (!image?.length) return m.reply(`📷 Reply/kirim gambar lalu gunakan *${m.prefix}${m.command}*`);
  const key = config.APIkey?.xterm;
  const base = String(config.apiBase?.xterm || "https://api.termai.cc").replace(/\/$/, "");
  if (!key) return m.reply("❌ API XTerm/Termai belum tersedia di config.js");
  await m.react("🕕");
  try {
    const { data, status } = await axios.post(`${base}/api/img2img/edit?key=${encodeURIComponent(key)}`, {
      image,
      prompt: promptMap.get(m.command) || m.args.join(" ") || "enhance this image",
    }, { headers: { "Content-Type": "application/json" }, responseType: "arraybuffer", timeout: 180000 });
    if (status >= 400) throw new Error(`HTTP ${status}`);
    await sock.sendMessage(m.chat, { image: Buffer.from(data), caption: `✨ *${m.command}* selesai` }, { quoted: m });
    await m.react("✅");
  } catch (e) {
    console.error("[XTERM MAKER]", e.message);
    await m.react("❌");
    return m.reply("❌ Gagal memproses gambar dengan API XTerm/Termai. Cek API key/limit.");
  }
}

export { pluginConfig as config, handler };
