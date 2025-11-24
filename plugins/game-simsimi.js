import axios from 'axios'
import translate from '@vitalets/google-translate-api'

var handler = async (m, { conn, text, command, usedPrefix }) => {
  const botJid = (conn.user?.jid || conn.user?.id || '').split('@')[0]

  // Si menciona al bot o responde al bot, tomar ese texto
  if (!text && (m.mentionedJid?.includes(conn.user.jid) || m.quoted?.sender === conn.user.jid)) {
    text = (m.text || '').replace(new RegExp(`@${botJid}`, 'gi'), '').trim()
  }

  if (!text) {
    return m.reply(`Uso correcto:\n*${usedPrefix + command} Hola bot*`)
  }

  try {
    await m.react('🕒')
    const res = await simitalk(text)
    await conn.sendMessage(m.chat, { text: res.resultado.simsimi }, { quoted: m })
    await m.react('✔️')
  } catch (e) {
    console.log(e)
    await m.react('✖️')
    return m.reply('⚠ Hubo un error al contactar a SimSimi.')
  }
}

handler.before = async (m, { conn }) => {
  const botJid = (conn.user?.jid || conn.user?.id || '').split('@')[0]
  const mentioned = m.mentionedJid?.includes(conn.user.jid)
  const quotedFromBot = m.quoted?.sender === conn.user.jid

  if (!mentioned && !quotedFromBot) return

  const text = (m.text || '').replace(new RegExp(`@${botJid}`, 'gi'), '').trim()
  if (!text) return

  try {
    await m.react('🕒')
    const res = await simitalk(text)
    await conn.sendMessage(m.chat, { text: res.resultado.simsimi }, { quoted: m })
    await m.react('✔️')
  } catch (e) {
    console.error('Error simi.auto:', e)
    await m.react('✖️')
  }
}

handler.help = ['simi <texto>', 'bot <texto>']
handler.tags = ['fun']
handler.command = ['simi', 'simisimi', 'bot', 'alexa', 'cortana']

export default handler



// ─────────────────────────────────────────────
// FUNCIONES SIMSIMI (3 APIs en cascada)
// ─────────────────────────────────────────────
async function simitalk(ask, apikey = "iJ6FxuA9vxlvz5cKQCt3", language = "es") {
  if (!ask)
    return { status: false, resultado: { msg: "Debes ingresar un texto." } }

  try {
    const res1 = await chatsimsimi(ask, language)
    if (res1.message && res1.message !== 'indefinida')
      return { status: true, resultado: { simsimi: res1.message } }
    throw new Error()
  } catch {
    try {
      const api2 = await axios.get(`https://delirius-apiofc.vercel.app/tools/simi?text=${encodeURIComponent(ask)}`)
      const trad = await translate(api2.data.data.message, { to: language })
      if (!trad.text || trad.text === 'indefinida') throw new Error()
      return { status: true, resultado: { simsimi: trad.text } }
    } catch {
      try {
        const api3 = await axios.get(`https://api.anbusec.xyz/api/v1/simitalk?apikey=${apikey}&ask=${ask}&lc=${language}`)
        return { status: true, resultado: { simsimi: api3.data.message } }
      } catch (err3) {
        return { status: false, resultado: { msg: "Todas las APIs fallaron.", error: err3.message } }
      }
    }
  }
}

async function chatsimsimi(ask, language) {
  try {
    const response = await axios.post(
      "https://simi.anbuinfosec.live/api/chat",
      { ask, lc: language },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    )
    return response.data
  } catch {
    return { success: false, message: "Error en API SimSimi." }
  }
}
