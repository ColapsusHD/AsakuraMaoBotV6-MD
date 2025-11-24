var handler = async (m, { conn, participants, usedPrefix, command, args }) => {
  // Obtener usuario por mención o respuesta
  let mentionedJid = m.mentionedJid || []
  let user = mentionedJid.length
    ? mentionedJid[0]
    : m.quoted?.sender
      ? m.quoted.sender
      : null

  if (!user)
    return conn.reply(m.chat, `❀ Debes mencionar o responder a un usuario para expulsarlo.\n\nEjemplo:\n${usedPrefix + command} @usuario [motivo]\n${usedPrefix + command} (respondiendo mensaje) [motivo]`, m)

  // Obtener motivo
  let text = args.join(' ').trim()

  // Si se usó mención → eliminar el tag del motivo
  if (mentionedJid.length)
    text = text.replace('@' + user.split('@')[0], '').trim()

  // Si se respondió un mensaje → args es el motivo
  const motivo = text.length ? text : 'Sin motivo'

  try {
    const groupInfo = await conn.groupMetadata(m.chat)
    const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net'

    if (user === conn.user.jid)
      return conn.reply(m.chat, `ꕥ No puedo eliminar al bot.`, m)

    if (user === ownerGroup)
      return conn.reply(m.chat, `ꕥ No puedo eliminar al propietario del grupo.`, m)

    if (user === ownerBot)
      return conn.reply(m.chat, `ꕥ No puedo eliminar al propietario del bot.`, m)

    // Expulsar usuario
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')

    // Aviso con motivo
    await conn.reply(
      m.chat,
      `🚫 Usuario expulsado\n` +
      `👤 *${'@' + user.split('@')[0]}*\n` +
      `📝 *Motivo:* ${motivo}`,
      m,
      { mentions: [user] }
    )

  } catch (e) {
    conn.reply(
      m.chat,
      `⚠︎ Ocurrió un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e.message}`,
      m
    )
  }
}

handler.help = ['kick <@usuario> [motivo]']
handler.tags = ['grupo']
handler.command = ['kick', 'echar', 'hechar', 'sacar', 'ban']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
