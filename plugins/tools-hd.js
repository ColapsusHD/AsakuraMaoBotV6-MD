import fetch from 'node-fetch'
import fs from 'fs'
import uploadImage from "../src/libraries/uploadImage.js"

const handler = async (m, { conn, usedPrefix, command }) => {
  try {

    // Detectar imagen correctamente desde cualquier formato
    const q =
      m.quoted?.message?.imageMessage
        ? m.quoted
        : m.message?.imageMessage
        ? m
        : m.quoted
        ? m.quoted
        : m

    // Buscar mimetype real
    let mime =
      q.mimetype ||
      q.mediaType ||
      q.msg?.mimetype ||
      q.message?.imageMessage?.mimetype ||
      m.message?.imageMessage?.mimetype ||
      ""

    // Si envió imagen + comando, mime llega como undefined → asignamos uno válido
    if (!mime && m.message?.imageMessage) mime = "image/jpeg"

    // Validación real
    if (!mime)
      return m.reply("❀ Por favor, envía o responde una imagen con el comando.")

    if (!/image\/(jpe?g|png)/i.test(mime))
      return m.reply(`ꕥ Formato no compatible (${mime}). Usa JPG o PNG.`)

    // Descargar imagen
    let img = await q.download?.()

    // Descarga manual si q.download falla
    if (!img) {
      const url =
        q.message?.imageMessage?.url ||
        m.message?.imageMessage?.url ||
        null
      if (!url) return m.reply("⚠︎ No se pudo leer la imagen correctamente.")
      const res = await fetch(url)
      img = Buffer.from(await res.arrayBuffer())
    }

    if (!img || img.length < 1000)
      return m.reply("⚠︎ Imagen dañada o inválida.")

    await m.react("🕒")

    // Subir imagen
    const fileUrl = await uploadImage(img)

    // Procesar imagen
    const result = await upscaleWithStellar(fileUrl)

    await conn.sendMessage(
      m.chat,
      {
        image: result,
        caption: "✔️ Imagen mejorada correctamente."
      },
      { quoted: m }
    )

    await m.react("✔️")

  } catch (e) {
    await m.react("✖️")
    return m.reply(`⚠️ Error procesando la imagen.\n${e}`)
  }
}

handler.help = ["remini", "hd", "enhance"]
handler.tags = ["ai", "tools"]
handler.command = ["remini", "hd", "enhance"]
export default handler

async function upscaleWithStellar(url) {
  const endpoint = `https://api.stellarwa.xyz/tools/upscale?url=${url}&key=BrunoSobrino`
  const res = await fetch(endpoint)

  if (!res.ok) throw new Error("Error en el servidor de upscale.")

  return Buffer.from(await res.arrayBuffer())
}
