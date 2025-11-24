import fs from "fs"
import axios from "axios"
import uploadImage from "../lib/uploadImage.js"
import FileType from "file-type"

const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Detectar la imagen
    const q = m.quoted ? m.quoted : m
    let mime =
      q.mimetype ||
      q.mediaType ||
      q.msg?.mimetype ||
      q.message?.imageMessage?.mimetype ||
      m.message?.imageMessage?.mimetype ||
      ""

    // Descargar la imagen
    const img = await q.download()
    if (!img) throw `Debes enviar o responder una imagen.\n\nUso: *${usedPrefix + command}*`

    // Si WhatsApp NO entrega mimetype (caso del error), lo detectamos del archivo
    if (!mime) {
      const type = await FileType.fromBuffer(img)
      if (type) mime = type.mime
    }

    if (!/image\/(jpe?g|png)/i.test(mime))
      throw `El archivo (${mime}) no es una imagen válida.`

    // Reacción mientras procesa
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })
    m.reply("Procesando tu imagen, por favor espera…")

    // Subir imagen
    const fileUrl = await uploadImage(img)

    // Mejorar imagen
    const resultado = await upscaleWithStellar(fileUrl)

    await conn.sendMessage(
      m.chat,
      { image: resultado, caption: "✔️ Imagen mejorada correctamente." },
      { quoted: m }
    )

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
