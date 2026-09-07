export const FEATURE_CREDIT = "Fitur By: Anita Putri Azzahra\nFitur SC Bot Ryo Yamada MD 👑\nTiktok: https://tiktok.com/@anita.putri.azzah1\nSaluran Resmi: ";

let handler = async (m, { conn, args, command }) => {
	let group = m.chat
        await m.reply('Sayonara , , ! (≧ω≦)ゞ', m.chat) 
        await  conn.groupLeave(group)
        }
handler.help = ['leavegc', 'out']
handler.tags = ['owner']
handler.command = /^(out|leavegc)$/i

handler.rowner = true

export default handler
