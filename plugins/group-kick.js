const handler = async (m, { conn, text, participants, groupMetadata }) => {

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

  // Si no detecta usuario
  if (!target) {
    return m.reply(
      `❗ Debes mencionar o responder a un usuario.\n\nEjemplos:\n` +
      `• *${m.prefix}ban @usuario*\n` +
      `• *${m.prefix}ban @usuario motivo*\n` +
      `• *${m.prefix}ban* (respondiendo)\n` +
      `• *${m.prefix}ban motivo* (respondiendo)`
    );
  }

  // Evitar autokick del bot
  if (target === conn.user.jid)
    return m.reply("❗ No puedo expulsarme a mí mismo.");

  // ------ NUEVO: EVITAR BANEAR ADMINS Y OWNER ------

  const groupAdmins = participants
    .filter((p) => p.admin === "admin" || p.admin === "superadmin")
    .map((p) => p.id);

  const owner = groupMetadata.owner || groupAdmins[0]; // fallback por si WhatsApp no envía owner

  if (target === owner) {
    return m.reply("❗ No puedo expulsar al *propietario* del grupo.");
  }

  if (groupAdmins.includes(target)) {
    return m.reply("❗ No puedo expulsar a un *administrador*.");
  }

  // ----------------------------------------------------

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
