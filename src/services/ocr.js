import Tesseract from 'tesseract.js'

let worker = null

export async function initOCR(onProgress) {
  if (worker) return worker

  worker = await Tesseract.createWorker('fra', 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  return worker
}

export async function recognizeText(imageFile, onProgress) {
  const w = await initOCR(onProgress)
  const result = await w.recognize(imageFile)
  return result.data.text
}

export function parseWords(rawText) {
  // Split by common separators, newlines, punctuation
  const raw = rawText
    .split(/[\n\r,;.!?:()[\]{}|/\\]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  // Filter to only words (letters, accents, hyphens, apostrophes)
  const words = []
  for (const chunk of raw) {
    // Split further by whitespace
    const parts = chunk.split(/\s+/)
    for (const part of parts) {
      const clean = part
        .toLowerCase()
        .replace(/[^a-zàâäéèêëîïôùûüçœæ'-]/g, '')
        .trim()
        .replace(/^['-]+|['-]+$/g, '') // Remove leading/trailing hyphens/apostrophes
      if (clean.length >= 2) {
        words.push(clean)
      }
    }
  }

  // Deduplicate
  return [...new Set(words)]
}

export async function terminateOCR() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
