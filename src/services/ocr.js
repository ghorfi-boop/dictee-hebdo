// OCR via OpenRouter GPT-4o Vision (serverless proxy Vercel)

export async function recognizeFromFile(imageFile, onProgress) {
  onProgress?.(10)

  try {
    // Resize image before sending (max 1024px, quality 0.8) to keep payload small
    const base64 = await resizeAndConvertToBase64(imageFile, 1024, 0.82)
    onProgress?.(40)

    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: 'image/jpeg'
      })
    })

    onProgress?.(85)

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(`OCR API error: ${response.status} — ${err.error || 'unknown'}`)
    }

    const data = await response.json()
    onProgress?.(100)

    if (!data.words || data.words.length === 0) {
      throw new Error('Aucun mot extrait. Essayez avec une photo plus nette ou saisissez manuellement.')
    }

    return data.words

  } catch (err) {
    console.error('OCR failed:', err.message)
    throw err
  }
}

/**
 * Resize image to maxSize px (longest side) and convert to base64 JPEG
 */
function resizeAndConvertToBase64(file, maxSize = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Scale down if needed
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Get base64 without the data:image/jpeg;base64, prefix
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de charger l\'image'))
    }

    img.src = url
  })
}
