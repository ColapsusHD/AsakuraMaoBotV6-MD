let handler = async (m, { conn }) => {
    await conn.sendMessage(m.chat, { react: { text: '🎫', key: m.key } })
    m.reply(global.concurso)
}

handler.help = ['concurso']
handler.tags = ['grupo']
handler.command = ['concurso', 'concursofutabuclub']
handler.group = true

export default handler

global.concurso = `Nada aún!`
