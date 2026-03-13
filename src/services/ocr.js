// OCR via OpenRouter GPT-4o Vision (serverless proxy)
// Fallback: Tesseract.js local si le proxy échoue

export async function recognizeFromFile(imageFile, onProgress) {
  try {
    onProgress?.(10)

    // Convert file to base64
    const base64 = await fileToBase64(imageFile)
    onProgress?.(30)

    // Call serverless proxy
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: imageFile.type || 'image/jpeg'
      })
    })

    onProgress?.(80)

    if (!response.ok) throw new Error('OCR proxy failed')

    const data = await response.json()
    onProgress?.(100)

    return data.words || []

  } catch (err) {
    console.warn('GPT-4o OCR failed, falling back to Tesseract:', err)
    return await tesseractFallback(imageFile, onProgress)
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove the data:image/...;base64, prefix
      const result = reader.result.split(',')[1]
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function tesseractFallback(imageFile, onProgress) {
  try {
    const Tesseract = (await import('tesseract.js')).default
    const worker = await Tesseract.createWorker('fra', 1, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100))
        }
      }
    })
    const result = await worker.recognize(imageFile)
    await worker.terminate()
    return parseWords(result.data.text)
  } catch (err) {
    console.error('Tesseract fallback failed:', err)
    return []
  }
}

function parseWords(rawText) {
  const raw = rawText
    .split(/[\n\r,;.!?:()[\]{}|/\\]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const words = []
  for (const chunk of raw) {
    const parts = chunk.split(/\s+/)
    for (const part of parts) {
      const clean = part
        .toLowerCase()
        .replace(/[^a-zàâäéèêëîïôùûüçœæ'-]/g, '')
        .trim()
        .replace(/^['-]+|['-]+$/g, '')
      if (clean.length >= 2) words.push(clean)
    }
  }
  return [...new Set(words)]
}
