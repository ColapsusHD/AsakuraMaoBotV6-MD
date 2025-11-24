let handler = async (m, { conn }) => {
    await conn.sendMessage(m.chat, { react: { text: '🔗', key: m.key } })
    m.reply(global.discord)
}

handler.help = ['discord']
handler.tags = ['grupo']
handler.command = ['serverdis', 'serverdiscord', 'discord', 'grupodiscord', 'linkdiscord']
handler.group = true

export default handler

global.discord = `Nuestro Server de Discord!
Link: https://discord.gg/UjdSaTESQG`
