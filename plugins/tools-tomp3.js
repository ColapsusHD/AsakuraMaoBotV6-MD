import { toAudio } from '../lib/converter.js'

const handler = async (m, { conn }) => {
  try {
    // Obtener mensaje origen
    const q = m.quoted ? m.quoted : m
    const msg = q.msg || q

    // Detectar MIME de forma segura
    const mime =
      msg?.mimetype ||
      q?.mimetype ||
      q?.mediaType ||
      ''

    if (!/video|audio/.test(mime))
      throw '*📦 | Envía o responde a un audio/video para convertirlo a MP3.*'

    // Descargar archivo
    const media = await q.download()
    if (!media)
      throw '*⚠️ | No se pudo descargar el archivo.*'

    // Convertir a MP3
    const audio = await toAudio(media, 'mp4')
    if (!audio?.data)
      throw '*❌ | Error al convertir a MP3.*'

    // Enviar audio
    await conn.sendMessage(
      m.chat,
      { audio: audio.data, mimetype: 'audio/mpeg' },
      { quoted: m }
    )

  } catch (error) {
    console.log("Error en tomp3:", error)
    throw '*❌ | No se pudo procesar el archivo.*'
  }
}

handler.help = ['tomp3']
handler.tags = ['converter']
handler.command = ['tomp3', 'toaudio']

export default handler
