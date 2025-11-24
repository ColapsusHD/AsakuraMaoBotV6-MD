let handler = async (m, { conn }) => {
    await conn.sendMessage(m.chat, { react: { text: '📄', key: m.key } })
    m.reply(global.contenido)
}

handler.help = ['contenido']
handler.tags = ['grupo']
handler.command = ['contenido', 'listacontenido', 'listcontenido', 'contenidopermitido']
handler.group = true

export default handler

global.contenido = `*_✅|CONTENIDO PERMITIDO_*
★ Futanari
★ Trapos/Femboy's
★ Hentai/Furry
★ Transexual
★ Pack Soft/Semi-Desnudo
★ Porno normal

*_❌|CONTENIDO PROHIBIDO_*
✦ Earfuck
✦ Scat
✦ Necrofilia 
✦ Zoofilia
✦ Gore
✦ Vore
✦ CP (Child Porn)
✦ Toddler (Relación con bebés)
✦ Lolis/Shotas

⭐| Recuerda que la temática tiene que ser más de Futanari.`
