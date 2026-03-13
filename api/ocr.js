// Vercel config must be exported as named export alongside the handler
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {}

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' })
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dictee-app.vercel.app',
        'X-Title': 'Dictee Hebdomadaire',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: 'Cette image contient une liste de mots de vocabulaire pour enfants. Extrais UNIQUEMENT les mots de la liste. Ignore les numéros, tirets, phrases et tout autre texte. Réponds UNIQUEMENT avec un tableau JSON valide de mots en minuscules, sans aucune autre explication. Exemple: ["bonjour","maison","école"]',
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter error:', response.status, errText)
      return res.status(502).json({ error: `OpenRouter error ${response.status}` })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    console.log('GPT-4o response:', content)

    const match = content.match(/\[[\s\S]*?\]/)
    if (!match) {
      return res.status(200).json({ words: [] })
    }

    const words = JSON.parse(match[0])
    const cleaned = words
      .filter((w) => typeof w === 'string' && w.length >= 2)
      .map((w) =>
        w
          .toLowerCase()
          .trim()
          .replace(/[^a-zàâäéèêëîïôùûüçœæ'\- ]/g, '')
          .trim()
      )
      .filter((w) => w.length >= 2)

    return res.status(200).json({ words: cleaned })
  } catch (err) {
    console.error('OCR handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
