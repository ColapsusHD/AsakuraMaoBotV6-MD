import fs from "fs"
import axios from "axios"
import uploadImage from "../lib/uploadImage.js"
import FileType from "file-type"

const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Detectar mensaje que contiene imagen
    const q =
      m.quoted?.message?.imageMessage
        ? { message: { imageMessage: m.quoted.message.imageMessage } }
        : m.message?.imageMessage
        ? m
        : m.quoted
        ? m.quoted
        : m

    // Extraer mimetype si existe
    let mime =
      q.mimetype ||
      q.mediaType ||
      q.msg?.mimetype ||
      q.message?.imageMessage?.mimetype ||
      m.message?.imageMessage?.mimetype ||
      ""

    // Intento normal de descarga
    let img = await q.download?.()

    // Si falla, hacemos descarga manual (solución definitiva)
    if (!img) {
      const url =
        q.message?.imageMessage?.url ||
        m.message?.imageMessage?.url ||
        null

      if (!url) throw `Debes enviar o responder una imagen.`

      const res = await axios.get(url, { responseType: "arraybuffer" })
      img = Buffer.from(res.data)
    }

    // Detectar mimetype desde el buffer si WhatsApp no lo envió
    if (!mime) {
      const type = await FileType.fromBuffer(img)
      if (type) mime = type.mime
    }

    if (!/image\/(jpe?g|png)/i.test(mime))
      throw `El archivo (${mime}) no es una imagen válida.`

    // Reacción mientras procesa
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })
    m.reply("Procesando tu imagen, espera un momento…")

    // Subir la imagen
    const fileUrl = await uploadImage(img)

    // Upscaling
    const enhanced = await upscaleWithStellar(fileUrl)

    // Enviar resultado
    await conn.sendMessage(
      m.chat,
      {
        image: enhanced,
        caption: "✔️ Imagen mejorada correctamente."
      },
      { quoted: m }
    )

    // Reacción final
    await conn.sendMessage(m.chat, { react: { text: "✔️", key: m.key } })

  } catch (e) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
    throw `⚠️ Error procesando la imagen.\n${e}`
  }
}

handler.help = ["remini", "hd", "enhance"]
handler.tags = ["ai", "tools"]
handler.command = ["remini", "hd", "enhance"]

export default handler

async function upscaleWithStellar(url) {
  const endpoint = `https://api.stellarwa.xyz/tools/upscale?url=${url}&key=BrunoSobrino`
  const { data } = await axios.get(endpoint, {
    responseType: "arraybuffer",
    headers: { accept: "image/*" }
  })
  return Buffer.from(data)
}
