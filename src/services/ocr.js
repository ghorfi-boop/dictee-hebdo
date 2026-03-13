// OCR via OpenRouter GPT-4o Vision (serverless proxy Vercel)
// Fallback manuel si le proxy échoue

export async function recognizeFromFile(imageFile, onProgress) {
  onProgress?.(10)

  try {
    // Convert to base64
    const base64 = await fileToBase64(imageFile)
    onProgress?.(40)

    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: imageFile.type || 'image/jpeg'
      })
    })

    onProgress?.(85)

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(`OCR API error: ${response.status} ${err.error || ''}`)
    }

    const data = await response.json()
    onProgress?.(100)

    const words = data.words || []
    if (words.length === 0) {
      throw new Error('Aucun mot extrait — photo peut-être floue ou liste non reconnue')
    }

    return words

  } catch (err) {
    console.error('OCR failed:', err.message)
    // Re-throw so the UI can show the real error instead of silently using Tesseract
    throw err
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image'))
    reader.readAsDataURL(file)
  })
}
