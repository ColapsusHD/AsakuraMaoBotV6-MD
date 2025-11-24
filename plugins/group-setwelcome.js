import fetch from 'node-fetch'
import fs from 'fs'
import { generarBienvenida } from './_welcome.js'  // ❌ quitar generarDespedida

const handler = async (m, { conn, command, usedPrefix, text, groupMetadata }) => {
  const value = text ? text.trim() : ''
  const chat = global.db.data.chats[m.chat]

  if (command === 'setgp') {
    return m.reply(`✦ Ingresa la categoría que deseas modificar para tu grupo.\n\n🜸 Categorías disponibles:\n• ${usedPrefix}gpname <nuevo nombre>\n> Cambia el nombre del grupo\n• ${usedPrefix}gpdesc <nueva descripción>\n> Modifica la descripción del grupo\n• ${usedPrefix}gpbanner <imagen>\n> Establece una nueva imagen para el grupo (responde a una imagen)\n• ${usedPrefix}setwelcome <mensaje>\n> Configura el mensaje de bienvenida para nuevos miembros\n• ${usedPrefix}testwelcome\n> Simula el mensaje de bienvenida`)
  }

  try {
    switch (command) {

      case 'setwelcome': {
        if (!value)
          return m.reply(`ꕥ Debes enviar un mensaje para establecerlo como bienvenida.\n> Variables: {usuario}, {grupo}, {desc}\n\nEjemplo:\n${usedPrefix}setwelcome Bienvenido {usuario} a {grupo}!`)

        chat.sWelcome = value
        m.reply(`ꕥ Mensaje de bienvenida establecido correctamente.\n> Usa ${usedPrefix}testwelcome para probarlo.`)
        break
      }

      // ❌ QUITADO COMPLETAMENTE → NO MÁS SETBYE
      // case 'setbye': ...

      case 'testwelcome': {
        if (!chat.sWelcome)
          return m.reply('⚠︎ No hay mensaje de bienvenida configurado.')

        // Generamos bienvenida SIN IMAGEN
        const { texto, mentions } = await generarBienvenida({
          conn,
          userId: m.sender,
          groupMetadata,
          chat
        })

        await conn.sendMessage(m.chat, { text: texto, mentions }, { quoted: m })
        break
      }

      // ❌ QUITADO → YA NO EXISTE testbye
    }
  } catch (e) {
    m.reply(`⚠︎ Ocurrió un error.\n> Usa ${usedPrefix}report para informarlo.\n\n${e.message}`)
  }
}

handler.help = ['setwelcome', 'testwelcome']    // ❌ quitado setbye y testbye
handler.tags = ['group']
handler.command = ['setgp', 'setwelcome', 'testwelcome']  // ❌ quitados
handler.admin = true
handler.group = true

export default handler
