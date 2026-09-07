export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

const pluginConfig = {
  name: "biner",
  alias: ["texttobin", "teks2bin", "encodebiner"],
  category: "tools",
  description: "Mengubah teks menjadi kode binary",
  usage: ".biner <teks>",
  example: ".biner Hello",
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 2, energi: 0, isEnabled: true,
};

async function handler(m) {
  const text = String(m.args?.join(" ") || m.text || "").trim();
  if (!text) return m.reply(`🔢 *ENCODE BINARY*\n\nMasukkan teks.\nContoh: ${m.prefix}biner Hello`);
  const bin = [...text].map(ch => ch.codePointAt(0).toString(2)).join(" ");
  await m.react?.("🔢");
  return m.reply(`🔢 *ENCODE BINARY*\n\nInput: ${text}\n\nOutput:\n\`${bin}\``);
}

export { pluginConfig as config, handler };
