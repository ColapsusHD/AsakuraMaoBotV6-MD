var handler = async (m, { conn, participants, usedPrefix, command, args }) => {
    // 1. Obtener al usuario objetivo
    let mentionedJid = await m.mentionedJid
    let user = mentionedJid && mentionedJid.length ? mentionedJid[0] : m.quoted && await m.quoted.sender ? await m.quoted.sender : null
    
    if (!user) return conn.reply(m.chat, `❀ Debes mencionar a un usuario para poder expulsarlo del grupo.`, m)

    try {
        const groupInfo = await conn.groupMetadata(m.chat)
        const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
        const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
        
        // 2. Verificar si el usuario objetivo es administrador
        // Nos aseguramos de que participants exista antes de buscar
        if (participants) {
            let targetUser = participants.find(p => p.id === user)
            if (targetUser && (targetUser.admin === 'admin' || targetUser.admin === 'superadmin')) {
                return conn.reply(m.chat, `⚠︎ No puedo expulsar a un administrador del grupo.`, m)
            }
        }

        // 3. Verificaciones de seguridad
        if (user === conn.user.jid) return conn.reply(m.chat, `ꕥ No puedo eliminar el bot del grupo.`, m)
        if (user === ownerGroup) return conn.reply(m.chat, `ꕥ No puedo eliminar al propietario del grupo.`, m)
        if (user === ownerBot) return conn.reply(m.chat, `ꕥ No puedo eliminar al propietario del bot.`, m)

        // 4. Procesar el motivo
        // Usamos args para mayor compatibilidad
        let reason = args.join(' ').replace(/@\d+/g, '').trim()
        if (!reason) reason = 'Sin motivo especificado'

        // 5. Mensaje de despedida y Acción
        await conn.reply(m.chat, `_Usuario eliminado_\n\n*👤 Usuario:* @${user.split('@')[0]}\n*📝 Motivo:* ${reason}`, m, { mentions: [user] })
        
        await conn.groupParticipantsUpdate(m.chat, [user], 'remove')

    } catch (e) {
        console.error(e)
        conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e.message}`, m)
    }
}

handler.help = ['kick']
handler.tags = ['grupo']
handler.command = ['kick', 'echar', 'hechar', 'sacar', 'ban']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
