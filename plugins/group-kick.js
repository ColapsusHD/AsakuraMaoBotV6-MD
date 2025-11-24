const handler = async (m, { conn, text, participants, groupMetadata }) => {

  let target = null;
  let reason = null;

  // 1) Mención directa: .ban @usuario
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    target = m.mentionedJid[0];
    reason = text?.replace(/@\d+/g, "").trim() || null;
  }

  // 2) Respondiendo un mensaje
  else if (m.quoted?.sender) {
    target = m.quoted.sender;
    reason = text?.trim() || null;
  }

  // 3) Menciones ocultas en contextInfo
  else {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length > 0) {
      target = ctx.mentionedJid[0];
      reason = text?.replace(/@\d+/g, "").trim() || null;
    }
  }

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

  // Obtener admins del grupo
  const groupAdmins = participants
    .filter(p => p.admin === "admin" || p.admin === "superadmin")
    .map(p => p.id);

  const owner = groupMetadata.owner || groupAdmins[0];

  // ❌ NO EXPULSAR ADMIN JAMÁS
  if (target === owner) {
    return m.reply("❗ No puedo expulsar al propietario del grupo.");
  }

  if (groupAdmins.includes(target)) {
    return m.reply("❗ No puedo expulsar a un administrador del grupo.");
  }

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

  await new Promise(r => setTimeout(r, 800));

  try {
    await conn.groupParticipantsUpdate(m.chat, [target], "remove");
  } catch (e) {
    return m.reply("⚠ Ocurrió un error al expulsar al usuario.");
  }
};

handler.help = ['ban', 'kick', 'echar', 'expulsar'];
handler.tags = ['group'];
handler.command = ['ban', 'kick', 'echar', 'expulsar', 'eliminar', 'sacar'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
