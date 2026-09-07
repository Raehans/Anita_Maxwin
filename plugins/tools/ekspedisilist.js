export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

let handler = async (m, { conn }) => {
  const ekspedisi = [
    'shopee-express', 'ninja', 'lion-parcel', 'pos-indonesia', 'tiki',
    'acommerce', 'gtl-goto-logistics', 'paxel', 'sap-express', 'indah-logistik-cargo',
    'lazada-express-lex', 'lazada-logistics', 'janio-asia', 'jet-express', 'pcp-express',
    'pt-ncs', 'nss-express', 'grab-express', 'rcl-red-carpet-logistics', 'qrim-express',
    'ark-xpress', 'standard-express-lwe', 'luar-negeri-bea-cukai'
  ]

  let teks = `📦 *Daftar Ekspedisi yang Tersedia:*\n\n${ekspedisi.map(v => `• ${v}`).join('\n')}`

  await conn.reply(m.chat, teks, m)
}

handler.help = ['ekspedisilist']
handler.tags = ['tools']
handler.command = /^ekspedisilist$/i
handler.limit = false

export default handler
