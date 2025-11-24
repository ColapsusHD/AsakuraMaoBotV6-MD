import fs from "fs"
import axios from "axios"
import uploadImage from "../lib/uploadImage.js"

const handler = async (m, { conn }) => {
  try {
    // Determinar el mensaje que contiene la imagen
    let q = m.quoted ? m.quoted : m;

    // Detectar el mimetype de la imagen
    let mime =
      q.msg?.mimetype ||          // por si es un mensaje citado
      q.message?.imageMessage?.mimetype || // por si es imagen directa
      q.mimetype ||               // fallback
      q.mediaType || "";

    if (!mime) throw `❗ Debes enviar o responder una imagen con el comando.`;
    if (!/image\/(jpe?g|png)/.test(mime)) throw `❗ Formato no soportado (${mime}). Usa JPG o PNG.`;

    // Mensaje de reloj
    let statusMsg = await m.reply("⏳ Procesando...");

    // Descargar imagen
    let img;

    if (q.download) {
      // Caso mensaje citado o media con .download()
      img = await q.download();
    } else if (q.message?.imageMessage) {
      // Caso imagen directa con comando
      img = await conn.downloadMediaMessage(q);
    }

    if (!img) throw "❗ No pude descargar la imagen.";

    // Subir imagen
    const fileUrl = await uploadImage(img);

    // Mejorar imagen
    const banner = await upscaleWithStellar(fileUrl);

    // Enviar imagen mejorada
    await conn.sendMessage(
      m.chat,
      { image: banner },
      { quoted: m }
    );

    // Cambiar ⏳ → ✔️
    await conn.sendMessage(
      m.chat,
      { text: "✔️ Imagen procesada", edit: statusMsg.key }
    );

  } catch (e) {
    throw `⚠️ Error procesando la imagen.\n${e}`;
  }
}

handler.help = ["hd", "remini", "enhance"];
handler.tags = ["tools"];
handler.command = ["hd", "remini", "enhance"];
export default handler;

async function upscaleWithStellar(url) {
  const endpoint = `https://api.stellarwa.xyz/tools/upscale?url=${url}&key=BrunoSobrino`;

  const { data } = await axios.get(endpoint, {
    responseType: "arraybuffer",
    headers: { accept: "image/*" }
  });

  return Buffer.from(data);
}
