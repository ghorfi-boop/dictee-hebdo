export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64, mimeType = 'image/jpeg' } = req.body

  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' })

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dictee-app.vercel.app',
        'X-Title': 'Dictée Hebdomadaire'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` }
              },
              {
                type: 'text',
                text: `Tu es un assistant qui extrait des listes de mots à apprendre pour des enfants.
Regarde cette image et extrais UNIQUEMENT les mots de vocabulaire présents.
Ignore les numéros, tirets, dates, phrases complètes et tout autre texte.
Retourne UNIQUEMENT un tableau JSON valide de mots en minuscules, sans aucun autre texte.
Exemple de réponse attendue : ["bonjour","maison","école","jardin"]
Si tu ne vois pas de liste de mots, retourne : []`
              }
            ]
          }
        ],
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenRouter error:', err)
      return res.status(502).json({ error: 'OCR service error', detail: err })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    // Extract JSON array from response
    const match = content.match(/\[.*\]/s)
    if (!match) return res.status(200).json({ words: [] })

    const words = JSON.parse(match[0])
    const cleaned = words
      .filter(w => typeof w === 'string')
      .map(w => w.toLowerCase().trim())
      .filter(w => w.length >= 2)

    return res.status(200).json({ words: cleaned })

  } catch (err) {
    console.error('OCR handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
