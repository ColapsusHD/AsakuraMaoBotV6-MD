let handler = async (m, { conn }) => {
    await conn.sendMessage(m.chat, { react: { text: '🩵', key: m.key } })
    m.reply(global.telegram)
}

handler.help = ['telegram']
handler.tags = ['grupo']
handler.command = ['telegram', 'grupodetelegram', 'linktelegram']
handler.group = true

export default handler

global.telegram = `Nuestro grupo de Telegram!
Link: https://t.me/FutabuClub`
