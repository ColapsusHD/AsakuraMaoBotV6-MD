import axios from 'axios'
import translate from '@vitalets/google-translate-api'

var handler = async (m, { conn, text, command, usedPrefix }) => {

  const botJidFull = conn.user?.jid || conn.user?.id || ""
  const botJid = botJidFull.split("@")[0]

  // Menciones seguras
  const mentionedJids = Array.isArray(m.mentionedJid) ? m.mentionedJid : []
  const mentioned = mentionedJids.includes(botJidFull)
  const quotedFromBot = m.quoted?.sender === botJidFull

  // Si mencionan o responden al bot
  if (!text && (mentioned || quotedFromBot)) {
    text = (m.text || "").replace(new RegExp(`@${botJid}`, "gi"), "").trim()
  }

  if (!text) {
    return m.reply(`Uso:\n*${usedPrefix + command} Hola bot*`)
  }

  try {
    await m.react('🕒')

    const res = await simitalk(text)
    await conn.sendMessage(m.chat, { text: res.resultado.simsimi }, { quoted: m })

    await m.react('✔️')
  } catch (e) {
    console.log(e)
    await m.react('✖️')
    return m.reply("⚠ Ocurrió un error al contactar con SimSimi.")
  }
}


// AUTO-RESPUESTA CUANDO TE HABLAN
handler.before = async (m, { conn }) => {

  const botJidFull = conn.user?.jid || conn.user?.id || ""
  const botJid = botJidFull.split("@")[0]

  const mentionedJids = Array.isArray(m.mentionedJid) ? m.mentionedJid : []
  const mentioned = mentionedJids.includes(botJidFull)
  const quotedFromBot = m.quoted?.sender === botJidFull

  if (!mentioned && !quotedFromBot) return

  const text = (m.text || "").replace(new RegExp(`@${botJid}`, "gi"), "").trim()
  if (!text) return

  try {
    await m.react('🕒')

    const res = await simitalk(text)
    await conn.sendMessage(m.chat, { text: res.resultado.simsimi }, { quoted: m })

    await m.react('✔️')
  } catch (e) {
    console.log("Error en auto-simi:", e)
    await m.react('✖️')
  }
}


// METADATA DEL PLUGIN
handler.help = ['simi <texto>', 'bot <texto>']
handler.tags = ['fun']
handler.command = ['simi', 'simisimi', 'bot', 'alexa', 'cortana']

export default handler



// ─────────────────────────────────────────────
//       SISTEMA SIMSIMI → 3 APIs EN CASCADA
// ─────────────────────────────────────────────

async function simitalk(ask, apikey = "iJ6FxuA9vxlvz5cKQCt3", language = "es") {
  if (!ask)
    return { status: false, resultado: { msg: "Debes ingresar texto." } }

  // 1) API PRINCIPAL
  try {
    const res1 = await chatsimsimi(ask, language)
    if (res1.message && res1.message !== "indefinida") {
      return { status: true, resultado: { simsimi: res1.message } }
    }
    throw new Error()
  } catch {

    // 2) API SECUNDARIA (DELIRIUS)
    try {
      const api2 = await axios.get(
        `https://delirius-apiofc.vercel.app/tools/simi?text=${encodeURIComponent(ask)}`
      )
      const trad = await translate(api2.data.data.message, { to: language })
      if (!trad.text || trad.text === "indefinida") throw new Error()

      return { status: true, resultado: { simsimi: trad.text } }
    } catch {

      // 3) API BACKUP (ANBUSEC)
      try {
        const api3 = await axios.get(
          `https://api.anbusec.xyz/api/v1/simitalk?apikey=${apikey}&ask=${ask}&lc=${language}`
        )
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
