import fs from 'fs'
import path from 'path'
import te from '../../src/lib/anita-error.js'
import { updateAssetUrl } from '../../src/lib/anita-uploader.js'
const pluginConfig = {
    name: 'ganti-anita-demote.jpg',
    alias: ['gantianitademote', 'setanitademote'],
    category: 'owner',
    description: 'Ganti gambar anita-demote.jpg',
    usage: '.ganti-anita-demote.jpg (reply/kirim gambar)',
    example: '.ganti-anita-demote.jpg',
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
    if (!isImage) return m.reply(`🖼️ *ɢᴀɴᴛɪ ANITA-DEMOTE.JPG*\n\n> Kirim/reply gambar untuk mengganti\n> File: assets/images/anita-demote.jpg`)
    try {
        let buffer = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ Gagal mendownload gambar')
        await m.reply(`⏳ Sedang mengupload gambar...`)
        try {
            const newUrl = await updateAssetUrl('anita-demote', buffer, 'anita-demote.jpg')
            m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar anita-demote.jpg telah diganti ke URL baru:\n> ${newUrl}\n> Config telah diupdate secara realtime!`)
        } catch (e) {
            m.reply(`❌ Gagal mengupload gambar: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }