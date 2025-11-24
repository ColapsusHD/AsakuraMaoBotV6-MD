import fs from "fs"
import axios from "axios"
import uploadImage from "../src/libraries/uploadImage.js"

const handler = async (m, { conn }) => {
  try {
    // Detectar si la imagen viene citada o adjunta
    let q = m.quoted ? m.quoted : m;

    // Detectar mimetype real
    let mime =
      (q.msg?.mimetype) ||
      (q.message?.imageMessage?.mimetype) ||
      q.mimetype ||
      q.mediaType ||
      "";

    if (!mime) throw `❗ Debes enviar o responder una imagen con el comando.`
    if (!/image\/(jpe?g|png)/.test(mime)) throw `❗ Formato no soportado (${mime}). Usa JPG o PNG.`

    // Mensaje de reloj
    let statusMsg = await m.reply("⏳ Procesando...")

    // Descargar imagen
    const img =
      (await q.download?.()) ||
      (await conn.downloadMediaMessage?.(q));

    if (!img) throw "❗ No pude descargar la imagen."

    // Subir
    const fileUrl = await uploadImage(img)

    // Upscale
    const banner = await upscaleWithStellar(fileUrl)

    // Enviar imagen mejorada
    await conn.sendMessage(
      m.chat,
      { image: banner },
      { quoted: m }
    )

    // Cambiar ⏳ → ✔️
    await conn.sendMessage(
      m.chat,
      { text: "✔️ Imagen procesada", edit: statusMsg.key }
    );

  } catch (e) {
    throw `⚠️ Error procesando la imagen.\n${e}`
  }
}

handler.help = ["hd", "remini", "enhance"]
handler.tags = ["tools"]
handler.command = ["hd", "remini", "enhance"]
export default handler

async function upscaleWithStellar(url) {
  const endpoint = `https://api.stellarwa.xyz/tools/upscale?url=${url}&key=BrunoSobrino`

  const { data } = await axios.get(endpoint, {
    responseType: "arraybuffer",
    headers: {
      accept: "image/*"
    }
  })

  return Buffer.from(data)
}
