const groupMetadataCache = new Map();
const lidCache = new Map();

const handler = async (m, {conn, participants, command, usedPrefix, text}) => {

  const kicktext = `❀ Usa: _${usedPrefix + command} @usuario [motivo]_`;

  const getMentionedUserAndReason = async () => {
    let mentionedJid = null;
    let reason = null;
    const mentionedJids = await m.mentionedJid;

    if (mentionedJids && mentionedJids.length > 0) {
      mentionedJid = mentionedJids[0];
      if (text) {
        const textAfterMention = text.replace(/@\d+/g, '').trim();
        if (textAfterMention) reason = textAfterMention;
      }
    } else if (m.quoted && m.quoted.sender) {
      mentionedJid = m.quoted.sender;
      if (text && text.trim()) reason = text.trim();
    } else if (m.message?.extendedTextMessage?.contextInfo) {
      const ctx = m.message.extendedTextMessage.contextInfo;

      if (ctx.mentionedJid && ctx.mentionedJid.length > 0) {
        mentionedJid = ctx.mentionedJid[0];
        if (text) {
          const textAfterMention = text.replace(/@\d+/g, '').trim();
          if (textAfterMention) reason = textAfterMention;
        }
      } else if (ctx.participant) {
        mentionedJid = ctx.participant;
        if (text && text.trim()) reason = text.trim();
      }
    }

    if (!mentionedJid) return { user: null, reason: null };
    const resolved = await resolveLidToRealJid(mentionedJid, conn, m.chat);

    return { user: resolved, reason };
  };

  const { user: mentionedUser, reason: kickReason } = await getMentionedUserAndReason();

  if (!mentionedUser)
    return m.reply(kicktext, m.chat, {mentions: conn.parseMention(kicktext)});

  if (conn.user.jid.includes(mentionedUser))
    return m.reply("❌ No puedo expulsarme a mí mismo.");

  // anuncio con motivo si existe
  if (kickReason) {
    const msg = `╭─⬣「 🚫 *EXPULSIÓN* 🚫 」⬣
│
├❯ *Usuario:* @${mentionedUser.split('@')[0]}
├❯ *Acción:* Expulsado del grupo
├❯ *Motivo:* ${kickReason}
├❯ *Admin:* @${m.sender.split('@')[0]}
│
╰─⬣ *Adiós*`;

    await conn.sendMessage(m.chat, {
      text: msg,
      mentions: [mentionedUser, m.sender]
    });

    await new Promise(r => setTimeout(r, 2000));
  }

  // ejecutar expulsión
  try {
    const resp = await conn.groupParticipantsUpdate(m.chat, [mentionedUser], 'remove');
    const tag = mentionedUser.split('@')[0];

    if (resp[0]?.status === '200') {
      m.reply(`✔ Usuario @${tag} expulsado.`, {mentions: [mentionedUser]});
    } else if (resp[0]?.status === '406') {
      m.reply(`❌ No se pudo expulsar a @${tag}.`, {mentions: [mentionedUser]});
    } else if (resp[0]?.status === '404') {
      m.reply(`⚠ Usuario @${tag} no encontrado.`, {mentions: [mentionedUser]});
    } else {
      m.reply(`⚠ Ocurrió un problema desconocido.`);
    }
  } catch (e) {
    m.reply(`⚠ Error al intentar expulsar.`);
  }
};

handler.help = ['kick'];
handler.tags = ['group'];
handler.command = ['kick', 'ban', 'expulsar', 'eliminar', 'echar', 'sacar'];
handler.admin = handler.group = handler.botAdmin = true;

export default handler;

// -----------------------------------------
// RESOLVER LID
// -----------------------------------------
async function resolveLidToRealJid(lid, conn, groupChatId, maxRetries = 3, retryDelay = 1000) {
  const inputJid = lid?.toString();
  if (!inputJid || !inputJid.endsWith("@lid") || !groupChatId?.endsWith("@g.us"))
    return inputJid?.includes("@") ? inputJid : `${inputJid}@s.whatsapp.net`;

  if (lidCache.has(inputJid)) return lidCache.get(inputJid);

  const lidToFind = inputJid.split("@")[0];
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      let metadata;

      if (groupMetadataCache.has(groupChatId)) {
        metadata = groupMetadataCache.get(groupChatId);
      } else {
        metadata = await conn.groupMetadata(groupChatId);
        if (metadata) {
          groupMetadataCache.set(groupChatId, metadata);
          setTimeout(() => groupMetadataCache.delete(groupChatId), 300000);
        }
      }

      for (const p of metadata.participants) {
        try {
          if (!p?.jid) continue;
          const details = await conn.onWhatsApp(p.jid);
          if (!details?.[0]?.lid) continue;
          const possibleLid = details[0].lid.split("@")[0];

          if (possibleLid === lidToFind) {
            lidCache.set(inputJid, p.jid);
            return p.jid;
          }
        } catch {}
      }

      lidCache.set(inputJid, inputJid);
      return inputJid;

    } catch {
      if (++attempts >= maxRetries) {
        lidCache.set(inputJid, inputJid);
        return inputJid;
      }
      await new Promise(r => setTimeout(r, retryDelay));
    }
  }

  return inputJid;
}
