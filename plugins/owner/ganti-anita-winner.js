import fs from 'fs'
import path from 'path'
import te from '../../src/lib/anita-error.js'
import { updateAssetUrl } from '../../src/lib/anita-uploader.js'
const pluginConfig = {
    name: 'ganti-anita-winner.jpg',
    alias: ['gantianitawinner', 'setanitawinner'],
    category: 'owner',
    description: 'Ganti gambar anita-winner.jpg (thumbnail game winner)',
    usage: '.ganti-anita-winner.jpg (reply/kirim gambar)',
    example: '.ganti-anita-winner.jpg',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🏆 *ɢᴀɴᴛɪ ᴏᴜʀɪɴ-ᴡɪɴɴᴇʀ.ᴊᴘɢ*\n\n> Kirim/reply gambar untuk mengganti\n> File: assets/images/anita-winner.jpg`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ Gagal mendownload gambar`)
        }
        
        await m.reply(`⏳ Sedang mengupload gambar...`)
        try {
            const newUrl = await updateAssetUrl('anita-winner', buffer, 'anita-winner.jpg')
            m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar anita-winner.jpg telah diganti ke URL baru:\n> ${newUrl}\n> Config telah diupdate secara realtime!`)
        } catch (e) {
            m.reply(`❌ Gagal mengupload gambar: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }