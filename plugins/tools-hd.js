import fs from "fs"
import axios from "axios"
import uploadImage from "../src/libraries/uploadImage.js"

const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    // Detectar si hay imagen enviada junto al comando
    const q = m.quoted ? m.quoted : m
    const mime =
      q.mimetype ||
      q.mediaType ||
      q.msg?.mimetype ||
      q.message?.imageMessage?.mimetype ||
      (m.msg && m.msg.mimetype) ||
      ""

    if (!mime) throw `Debes enviar o responder una imagen.\n\nUso: *${usedPrefix + command}*`
    if (!/image\/(jpe?g|png)/i.test(mime)) throw `El archivo (${mime}) no es una imagen válida.`

    // ⏳ Reacción mientras procesa
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })

    m.reply("Procesando tu imagen, por favor espera…")

    // ↓ Funciona tanto con imagen respondida como con imagen adjunta
    const img = await q.download()
    if (!img) throw "No pude descargar la imagen."

    const fileUrl = await uploadImage(img)

    const resultado = await upscaleWithStellar(fileUrl)

    await conn.sendMessage(
      m.chat,
      { image: resultado, caption: "✔️ Imagen mejorada correctamente." },
      { quoted: m }
    )

    // ✔️ Reacción final de éxito
    await conn.sendMessage(m.chat, { react: { text: "✔️", key: m.key } })

  } catch (e) {
    // ❌ Reacción de error
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
