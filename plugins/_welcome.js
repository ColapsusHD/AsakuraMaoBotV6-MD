import fs from 'fs'
import { WAMessageStubType } from '@whiskeysockets/baileys'

async function generarBienvenida({ conn, userId, groupMetadata, chat }) {
  const username = `@${userId.split('@')[0]}`

  const fecha = new Date().toLocaleDateString("es-ES", {
    timeZone: "America/Mexico_City",
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const groupSize = groupMetadata.participants.length + 1
  const desc = groupMetadata.desc?.toString() || 'Sin descripción'

  const mensaje = (chat.sWelcome || 'Edita con el comando "setwelcome"')
    .replace(/{usuario}/g, `${username}`)
    .replace(/{desc}/g, `${desc}`)

  const texto = `✰ _Usuario_ » ${username}
  
  ● ${mensaje}
  
> ◆ _Ahora somos ${groupSize} Miembros._
> ꕥ Fecha » ${fecha}

૮꒰ ˶• ᴗ •˶꒱ა Disfruta tu estadía en el grupo!`

  return { texto, mentions: [userId] }
}

let handler = m => m

handler.before = async function (m, { conn, groupMetadata }) {
  if (!m.messageStubType || !m.isGroup) return !0

  const primaryBot = global.db.data.chats[m.chat].primaryBot
  if (primaryBot && conn.user.jid !== primaryBot) throw !1

  const chat = global.db.data.chats[m.chat]
  const userId = m.messageStubParameters[0]

  // SOLO SE MANDA TEXTO — SIN IMAGEN
  if (chat.welcome && m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {

    const { texto, mentions } = await generarBienvenida({
      conn,
      userId,
      groupMetadata,
      chat
    })

    rcanal.contextInfo.mentionedJid = mentions

    await conn.sendMessage(
      m.chat,
      { text: texto, ...rcanal },
      { quoted: null }
    )
  }
}

export { generarBienvenida }
export default handler
