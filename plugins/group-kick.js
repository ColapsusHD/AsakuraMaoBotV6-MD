const handler = async (m, { conn, text }) => {

  const getTargetAndReason = () => {
    let user = null;
    let reason = null;

    // 1) → Mención directa: .ban @user motivo
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      user = m.mentionedJid[0];
      reason = text?.replace(/@\d+/g, "").trim() || null;
      return { user, reason };
    }

    // 2) → Respondiendo: .ban motivo / .ban
    if (m.quoted?.sender) {
      user = m.quoted.sender;
      reason = text?.trim() || null;
      return { user, reason };
    }

    // 3) → ContextInfo (WhatsApp a veces pone menciones acá)
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length > 0) {
      user = ctx.mentionedJid[0];
      reason = text?.replace(/@\d+/g, "").trim() || null;
      return { user, reason };
    }

    return { user: null, reason: null };
  };

  const { user: target, reason } = getTargetAndReason();

  // Si no detecta usuario en ninguno de los modos
  if (!target) {
    return m.reply(
      `❗ Debes mencionar o responder a un usuario.\n\nEjemplos:\n` +
      `• *${m.prefix}ban @usuario*\n` +
      `• *${m.prefix}ban @usuario motivo*\n` +
      `• *${m.prefix}ban* (respondiendo)\n` +
      `• *${m.prefix}ban motivo* (respondiendo)`
    );
  }

  // Evitar autokick
  if (target === conn.user.jid) return m.reply("❗ No puedo expulsarme a mí mismo.");

  const kickReason = reason || "No especificado";

  // Mensaje de anuncio
  const msg = `╭─⬣「 🚫 *EXPULSIÓN* 🚫 」⬣
│
├❯ *Usuario:* @${target.split('@')[0]}
├❯ *Acción:* Expulsado del grupo
├❯ *Motivo:* ${kickReason}
├❯ *Admin:* @${m.sender.split('@')[0]}
│
╰─⬣ *Adiós*`;

  await conn.sendMessage(m.chat, {
    text: msg,
    mentions: [target, m.sender]
  });

  await new Promise(r => setTimeout(r, 1000));

  try {
    await conn.groupParticipantsUpdate(m.chat, [target], "remove");
  } catch (e) {
    m.reply("⚠ Ocurrió un error al expulsar al usuario.");
  }
};

handler.help = ['ban', 'kick', 'echar', 'expulsar'];
handler.tags = ['group'];
handler.command = ['ban', 'kick', 'echar', 'expulsar', 'eliminar', 'sacar'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
