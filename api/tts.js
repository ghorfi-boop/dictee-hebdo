export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { text } = req.body
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' })
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pFZP5JQG7iQjIQuC4Bku', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.75, similarity_boost: 0.85, speed: 0.82 }
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('ElevenLabs error:', err)
      return res.status(502).json({ error: 'TTS generation failed' })
    }

    const buffer = await response.arrayBuffer()
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('TTS proxy error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
