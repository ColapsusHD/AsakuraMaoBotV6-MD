const handler = async (m, { conn, text }) => {
  // Obtener usuario objetivo
  const getTargetAndReason = () => {
    let target = null;
    let reason = null;

    // 1) Si se menciona en el comando
    if (m.mentionedJid?.length) {
      target = m.mentionedJid[0];
      reason = text?.replace(/@\d+/g, '').trim() || null;
    }

    // 2) Si se responde a un mensaje
    else if (m.quoted?.sender) {
      target = m.quoted.sender;
      reason = text?.trim() || null;
    }

    return { target, reason };
  };

  const { target: mentionedUser, reason: kickReason } = getTargetAndReason();

  if (!mentionedUser) {
    return m.reply(
      `❗ Debes mencionar o responder a un usuario.\nEj:\n• *${m.prefix}ban @user motivo*\n• *${m.prefix}ban* (respondiendo a un mensaje)`
    );
  }

  // Evitar autokick
  if (mentionedUser === conn.user.jid)
    return m.reply("❗ No puedo expulsarme a mí mismo.");

  const reasonToUse = kickReason || "No especificado";

  // Mensaje de anuncio
  const msg = `╭─⬣「 🚫 *EXPULSIÓN* 🚫 」⬣
│
├❯ *Usuario:* @${mentionedUser.split('@')[0]}
├❯ *Acción:* Expulsado del grupo
├❯ *Motivo:* ${reasonToUse}
├❯ *Admin:* @${m.sender.split('@')[0]}
│
╰─⬣ *Adiós*`;

  // Enviar anuncio
  await conn.sendMessage(m.chat, {
    text: msg,
    mentions: [mentionedUser, m.sender],
  });

  // Pequeña pausa antes del kick (1.5s)
  await new Promise((r) => setTimeout(r, 1500));

  // Expulsar
  try {
    await conn.groupParticipantsUpdate(m.chat, [mentionedUser], "remove");
  } catch (e) {
    m.reply("⚠ No pude expulsar al usuario.");
  }
};

handler.help = ['kick', 'ban', 'expulsar', 'eliminar', 'echar', 'sacar'];
handler.tags = ['group'];
handler.command = ['kick', 'ban', 'expulsar', 'eliminar', 'echar', 'sacar'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
