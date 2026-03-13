import { openDB } from 'idb'

const DB_NAME = 'dictee_audio'
const STORE_NAME = 'audio_cache'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

async function getCachedAudio(word) {
  try {
    const db = await getDB()
    return await db.get(STORE_NAME, `audio_fr_${word}`)
  } catch {
    return null
  }
}

async function setCachedAudio(word, blob) {
  try {
    const db = await getDB()
    await db.put(STORE_NAME, blob, `audio_fr_${word}`)
  } catch (err) {
    console.warn('Failed to cache audio:', err)
  }
}

async function fetchFromAPI(word) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: word }),
  })
  if (!response.ok) throw new Error(`TTS API error: ${response.status}`)
  return await response.blob()
}

function fallbackTTS(word) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve()
      return
    }
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.85
    utterance.pitch = 1
    utterance.volume = 1

    // Try to find a French voice
    const voices = window.speechSynthesis.getVoices()
    const frVoice = voices.find((v) => v.lang.startsWith('fr'))
    if (frVoice) utterance.voice = frVoice

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

export async function generateAudio(word) {
  // 1. Check cache
  const cached = await getCachedAudio(word)
  if (cached) return cached

  // 2. Fetch from API
  try {
    const blob = await fetchFromAPI(word)
    await setCachedAudio(word, blob)
    return blob
  } catch (err) {
    console.warn('ElevenLabs TTS failed, using fallback:', err)
    return null
  }
}

export async function playAudio(word) {
  const blob = await generateAudio(word)

  if (blob) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => {
        URL.revokeObjectURL(url)
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        // Fallback
        fallbackTTS(word).then(resolve)
      }
      audio.play().catch(() => {
        URL.revokeObjectURL(url)
        fallbackTTS(word).then(resolve)
      })
    })
  }

  // Full fallback
  return fallbackTTS(word)
}

export async function preGenerateAll(words, onProgress) {
  for (let i = 0; i < words.length; i++) {
    await generateAudio(words[i])
    if (onProgress) onProgress(i + 1, words.length)
  }
}

export async function clearAudioCache() {
  try {
    const db = await getDB()
    await db.clear(STORE_NAME)
  } catch (err) {
    console.warn('Failed to clear audio cache:', err)
  }
}

export async function isWordCached(word) {
  const cached = await getCachedAudio(word)
  return !!cached
}
