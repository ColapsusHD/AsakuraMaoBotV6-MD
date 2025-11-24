import fs from "fs"
import axios from "axios"
import uploadImage from "../lib/uploadImage.js"

const handler = async (m, { conn, usedPrefix, command }) => {

  try {
    const q = m.quoted ? m.quoted : m

    const mime =
      q.mimetype ||
      q.mediaType ||
      q.msg?.mimetype ||
      q.mtype ||
      ""

    if (!mime) throw `Debes responder o enviar una imagen.\nUso: *${usedPrefix + command}*`
    if (!/image\/(jpe?g|png)/i.test(mime)) throw `El archivo (${mime}) no es una imagen válida.`

    m.reply("Procesando tu imagen, espera un momento…")

    // Descargar imagen
    const img = await q.download()
    if (!img) throw "No pude descargar la imagen."

    // Subir imagen
    const fileUrl = await uploadImage(img)

    // Upscale con Stellar API
    const resultado = await upscaleWithStellar(fileUrl)

    // Enviar imagen final
    await conn.sendMessage(
      m.chat,
      { image: resultado, caption: "✔️ Imagen mejorada correctamente." },
      { quoted: m }
    )

  } catch (e) {
    throw `⚠️ Ocurrió un error.\n${e}`
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
