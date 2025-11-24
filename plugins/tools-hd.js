import fetch from 'node-fetch'
import uploadImage from "../lib/uploadImage.js"

const handler = async (m, { conn }) => {
  try {

    // Detectar la imagen en cualquier tipo de mensaje
    const q =
      m.quoted?.message?.imageMessage
        ? m.quoted
        : m.message?.imageMessage
        ? m
        : m.quoted
        ? m.quoted
        : m

    // Extraer mimetype real desde cualquier estructura
    let mime =
      q.mimetype ||
      q.mediaType ||
      q.msg?.mimetype ||
      q.message?.imageMessage?.mimetype ||
      m.message?.imageMessage?.mimetype ||
      ""

    // → si la imagen viene con el comando, no trae mimetype
    if (!mime && m.message?.imageMessage) {
      mime = "image/jpeg"
    }

    // Validación final
    if (!mime)
      return m.reply("❀ Por favor, envía o responde una imagen.")

    if (!/image\/(jpe?g|png)/i.test(mime))
      return m.reply(`ꕥ Formato no compatible (${mime}). Usa JPG o PNG.`)

    // Descargar imagen
    let img = await q.download?.()

    // Descarga manual si falla .download()
    if (!img) {
      const url =
        q.message?.imageMessage?.url ||
        m.message?.imageMessage?.url ||
        null

      if (!url)
        return m.reply("⚠︎ No se pudo leer la imagen correctamente.")

      const res = await fetch(url)
      img = Buffer.from(await res.arrayBuffer())
    }

    if (!img || img.length < 1000)
      return m.reply("⚠︎ Imagen dañada o inválida.")

    // Reacción mientras procesa
    await m.react("🕒")

    const fileUrl = await uploadImage(img)
    const result = await upscaleWithStellar(fileUrl)

    await conn.sendMessage(
      m.chat,
      { image: result, caption: "✔️ Imagen mejorada correctamente." },
      { quoted: m }
    )

    await m.react("✔️")

  } catch (e) {
    await m.react("✖️")
    return m.reply(`⚠️ Error procesando la imagen.\n${e}`)
  }
}

handler.command = ["remini", "hd", "enhance"]
handler.help = ["hd"]
handler.tags = ["tools"]
export default handler

async function upscaleWithStellar(url) {
  const endpoint = `https://api.stellarwa.xyz/tools/upscale?url=${url}&key=BrunoSobrino`
  const res = await fetch(endpoint)

  if (!res.ok) throw "Fallo en el servidor."

  return Buffer.from(await res.arrayBuffer())
}
