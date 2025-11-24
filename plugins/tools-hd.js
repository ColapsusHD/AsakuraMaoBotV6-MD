import fs from "fs"
import axios from "axios"
import uploadImage from "../lib/uploadImage.js"

const handler = async (m, { conn }) => {
  try {
    // Determinar mensaje que contiene la imagen
    let q = m.quoted ? m.quoted : m;

    // Detectar mimetype
    let mime =
      q.msg?.mimetype ||
      q.message?.imageMessage?.mimetype ||
      q.mimetype ||
      q.mediaType ||
      "";

    if (!mime) throw `❗ Debes enviar o responder una imagen con el comando.`;
    if (!/image\/(jpe?g|png)/.test(mime)) throw `❗ Formato no soportado (${mime}). Usa JPG o PNG.`;

    // Agregar reacción de reloj ⏳ al mensaje original
    const statusReaction = await conn.sendMessage(
      m.chat,
      {
        react: {
          text: "⏳",
          key: m.key
        }
      }
    );

    // Descargar imagen
    let img;
    if (q.download) {
      img = await q.download();
    } else if (q.message?.imageMessage) {
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

    // Cambiar reacción a ✔️
    await conn.sendMessage(
      m.chat,
      {
        react: {
          text: "✔️",
          key: m.key
        }
      }
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
