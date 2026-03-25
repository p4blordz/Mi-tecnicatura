import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Falta el parametro url' });
  }

  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'No se pudo extraer el ID del video. Verifica que sea un link de YouTube valido.' });
    }

    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'es' });

    if (!segments || segments.length === 0) {
      return res.status(404).json({ error: 'Este video no tiene subtitulos disponibles.' });
    }

    const text = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();

    return res.status(200).json({
      text,
      videoId,
      segments: segments.length,
      chars: text.length,
    });
  } catch (error) {
    // Try without language preference if Spanish fails
    try {
      const videoId = extractVideoId(url);
      const segments = await YoutubeTranscript.fetchTranscript(videoId);

      if (!segments || segments.length === 0) {
        return res.status(404).json({ error: 'Este video no tiene subtitulos disponibles.' });
      }

      const text = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();

      return res.status(200).json({
        text,
        videoId,
        segments: segments.length,
        chars: text.length,
      });
    } catch {
      return res.status(500).json({
        error: 'No se pudo obtener la transcripcion. El video puede no tener subtitulos habilitados.',
      });
    }
  }
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Maybe it's just the video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  return null;
}
