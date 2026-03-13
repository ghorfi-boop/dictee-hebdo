import { useState, useCallback, useRef } from 'react'
import { playAudio } from '../services/tts'

const MAX_HEARTS = 4
const MAX_ATTEMPTS = 4

// ─── Sound effects (Web Audio API, no external files needed) ──────────────────

function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const times = [0, 0.15, 0.3]
    const freqs  = [523, 659, 784] // C5, E5, G5
    times.forEach((t, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + t)
      gain.gain.setValueAtTime(0.35, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.35)
    })
  } catch (_) {}
}

function playErrorSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch (_) {}
}

function playRevealSound() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(350, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch (_) {}
}

// ─── Smart hints ─────────────────────────────────────────────────────────────

/**
 * Analyse what the child already got right and return the most useful hint.
 * We never repeat info the child already demonstrated they know.
 *
 * @param {string} word       - correct word
 * @param {string} answer     - what the child typed
 * @param {number} attempts   - how many errors so far (1-based at this point)
 * @param {string[]} usedHints - hint types already shown
 */
/**
 * Returns a set of letter indices the child got right in their answer
 * compared to the correct word (position-by-position).
 */
function getCorrectPositions(word, answer) {
  const w = word.toLowerCase()
  const a = answer.toLowerCase().trim()
  const correct = new Set()
  const len = Math.min(w.length, a.length)
  for (let i = 0; i < len; i++) {
    if (a[i] === w[i]) correct.add(i)
  }
  return correct
}

function getSmartHint(word, answer, attempts, usedHints) {
  const w = word.toLowerCase()
  const a = answer.toLowerCase().trim()

  const sameLength = a.length === w.length
  const sameFirst  = a.length > 0 && a[0] === w[0]
  const sameLast   = a.length > 0 && a[a.length - 1] === w[w.length - 1]
  const correctPos = getCorrectPositions(w, a)

  const candidates = []

  // 1. First letter — skip if they already got it right
  if (!sameFirst && !usedHints.includes('first_letter')) {
    candidates.push({
      type: 'first_letter',
      label: `Commence par « ${w[0].toUpperCase()} »`,
      priority: 10,
    })
  }

  // 2. Last letter — skip if they already got it right
  if (!sameLast && !usedHints.includes('last_letter')) {
    candidates.push({
      type: 'last_letter',
      label: `Finit par « ${w[w.length - 1].toUpperCase()} »`,
      priority: 8,
    })
  }

  // 3. Number of letters — skip if they already have the right count
  if (!sameLength && !usedHints.includes('length')) {
    candidates.push({
      type: 'length',
      label: `${w.length} lettres : ${'_ '.repeat(w.length).trim()}`,
      priority: 7,
    })
  }

  // 4. Vowels — reveal vowels, but show letters already correctly placed
  if (!usedHints.includes('vowels')) {
    const vowels = 'aàâäeéèêëiîïoôuùûüy'
    const revealed = w
      .split('')
      .map((c, i) => {
        if (correctPos.has(i)) return c.toUpperCase() // already got this one
        if (vowels.includes(c)) return c.toUpperCase() // reveal vowels
        return '_'
      })
      .join(' ')
    // Only show if it adds new info (not all underscores)
    if (revealed.includes('_') || revealed !== w.toUpperCase().split('').join(' ')) {
      candidates.push({
        type: 'vowels',
        label: `Indice : ${revealed}`,
        priority: 6,
      })
    }
  }

  // 5. Alternated letters — show odd positions + already correct positions
  if (!usedHints.includes('alternated')) {
    const alt = w
      .split('')
      .map((c, i) => {
        if (correctPos.has(i)) return c.toUpperCase() // already got this one
        if (i % 2 === 0) return c.toUpperCase()       // reveal odd positions
        return '_'
      })
      .join(' ')
    candidates.push({
      type: 'alternated',
      label: `Indice : ${alt}`,
      priority: 5,
    })
  }

  // Sort by priority, pick the best unused one
  candidates.sort((a, b) => b.priority - a.priority)
  if (candidates.length > 0) return candidates[0]

  // Fallback: reveal the word
  return {
    type: 'revealed',
    label: word.toUpperCase(),
    priority: 0,
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useExercise(words) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [attempts, setAttempts]                 = useState(0)
  const [hearts, setHearts]                     = useState(MAX_HEARTS)
  const [hint, setHint]                         = useState(null)
  const [usedHintTypes, setUsedHintTypes]       = useState([])
  const [score, setScore]                       = useState({ correct: 0, total: 0, failedWords: [] })
  const [isFinished, setIsFinished]             = useState(false)
  const [lastResult, setLastResult]             = useState(null) // 'correct' | 'wrong'
  const [isPlaying, setIsPlaying]               = useState(false)
  const [lastAnswer, setLastAnswer]             = useState('')
  const inputRef                                = useRef(null)

  const currentWord = words[currentWordIndex] || ''

  const playCurrentWord = useCallback(async () => {
    if (isPlaying) return
    setIsPlaying(true)
    await playAudio(currentWord)
    setIsPlaying(false)
  }, [currentWord, isPlaying])

  const nextWord = useCallback(async (correct) => {
    const nextIndex = currentWordIndex + 1
    if (nextIndex >= words.length) {
      setIsFinished(true)
    } else {
      setCurrentWordIndex(nextIndex)
      setAttempts(0)
      setHearts(MAX_HEARTS)
      setHint(null)
      setUsedHintTypes([])
      setLastResult(null)
      setTimeout(async () => {
        setIsPlaying(true)
        await playAudio(words[nextIndex])
        setIsPlaying(false)
        inputRef.current?.focus()
      }, 600)
    }
  }, [currentWordIndex, words])

  const onSubmit = useCallback((answer) => {
    const norm   = answer.toLowerCase().trim()
    const target = currentWord.toLowerCase().trim()
    setLastAnswer(norm)

    if (norm === target) {
      // ✅ Correct
      playSuccessSound()
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }))
      setLastResult('correct')
      setTimeout(() => nextWord(true), 900)
    } else {
      // ❌ Wrong
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setHearts(prev => Math.max(0, prev - 1))
      setLastResult('wrong')

      if (newAttempts >= MAX_ATTEMPTS) {
        // No more tries — reveal the word
        playRevealSound()
        setScore(prev => ({
          ...prev,
          total: prev.total + 1,
          failedWords: [...prev.failedWords, currentWord],
        }))
        setHint({ type: 'revealed', label: currentWord.toUpperCase() })
        setTimeout(() => nextWord(false), 2000)
      } else {
        // Show smart hint
        playErrorSound()
        const h = getSmartHint(currentWord, answer, newAttempts, usedHintTypes)
        setHint(h)
        setUsedHintTypes(prev => [...prev, h.type])
        setTimeout(() => {
          setLastResult(null)
          inputRef.current?.focus()
        }, 600)
      }
    }
  }, [currentWord, attempts, usedHintTypes, nextWord])

  const getScorePct = useCallback(() => {
    if (score.total === 0) return 0
    return Math.round((score.correct / score.total) * 100)
  }, [score])

  const getStars = useCallback(() => {
    const pct = getScorePct()
    if (pct === 100) return 3
    if (pct >= 80)   return 3
    if (pct >= 60)   return 2
    if (pct >= 40)   return 1
    return 0
  }, [getScorePct])

  const restart = useCallback(() => {
    setCurrentWordIndex(0)
    setAttempts(0)
    setHearts(MAX_HEARTS)
    setHint(null)
    setUsedHintTypes([])
    setScore({ correct: 0, total: 0, failedWords: [] })
    setIsFinished(false)
    setLastResult(null)
    setLastAnswer('')
  }, [])

  return {
    currentWordIndex,
    currentWord,
    attempts,
    hearts,
    maxHearts: MAX_HEARTS,
    hint,
    score,
    isFinished,
    lastResult,
    isPlaying,
    inputRef,
    onSubmit,
    playCurrentWord,
    getScorePct,
    getStars,
    restart,
    lastAnswer,
    progress: words.length > 0 ? currentWordIndex / words.length : 0,
  }
}
