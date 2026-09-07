import fs from 'fs'
import path from 'path'
import te from '../../src/lib/anita-error.js'
import { updateAssetUrl } from '../../src/lib/anita-uploader.js'
const pluginConfig = {
    name: 'ganti-anita-store.jpg',
    alias: ['gantistore', 'setanitastore'],
    category: 'owner',
    description: 'Ganti gambar anita-store.jpg (thumbnail store)',
    usage: '.ganti-anita-store.jpg (reply/kirim gambar)',
    example: '.ganti-anita-store.jpg',
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
        return m.reply(`🖼️ *ɢᴀɴᴛɪ ᴏᴜʀɪɴ-sᴛᴏʀᴇ.ᴊᴘɢ*\n\n> Kirim/reply gambar untuk mengganti\n> File: assets/images/anita-store.jpg`)
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
            const newUrl = await updateAssetUrl('anita-store', buffer, 'anita-store.jpg')
            m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar anita-store.jpg telah diganti ke URL baru:\n> ${newUrl}\n> Config telah diupdate secara realtime!`)
        } catch (e) {
            m.reply(`❌ Gagal mengupload gambar: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }