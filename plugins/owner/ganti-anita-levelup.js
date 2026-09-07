import fs from 'fs'
import path from 'path'
import te from '../../src/lib/anita-error.js'
import { updateAssetUrl } from '../../src/lib/anita-uploader.js'
const pluginConfig = {
    name: 'ganti-anita-levelup.jpg',
    alias: ['gantianitalevelup', 'setanitalevelup'],
    category: 'owner',
    description: 'Ganti gambar anita-levelup.jpg',
    usage: '.ganti-anita-levelup.jpg (reply/kirim gambar)',
    example: '.ganti-anita-levelup.jpg',
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
    if (!isImage) return m.reply(`🖼️ *ɢᴀɴᴛɪ ANITA-LEVELUP.JPG*\n\n> Kirim/reply gambar untuk mengganti\n> File: assets/images/anita-levelup.jpg`)
    try {
        let buffer = m.quoted && m.quoted.isMedia ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ Gagal mendownload gambar')
        await m.reply(`⏳ Sedang mengupload gambar...`)
        try {
            const newUrl = await updateAssetUrl('anita-levelup', buffer, 'anita-levelup.jpg')
            m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar anita-levelup.jpg telah diganti ke URL baru:\n> ${newUrl}\n> Config telah diupdate secara realtime!`)
        } catch (e) {
            m.reply(`❌ Gagal mengupload gambar: ${e.message}`)
        }
    } catch (error) {
        await m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }