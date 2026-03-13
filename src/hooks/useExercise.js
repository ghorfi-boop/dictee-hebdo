import { useState, useCallback, useRef } from 'react'
import { playAudio } from '../services/tts'

const MAX_HEARTS = 4
const MAX_ATTEMPTS = 4

function getHint(word, attempts) {
  if (attempts === 0) return null
  if (attempts === 1) {
    // First letter
    return { type: 'first_letter', value: word[0].toUpperCase() + '_'.repeat(word.length - 1) }
  }
  if (attempts === 2) {
    // Number of letters
    return { type: 'length', value: `${word.length} lettres` }
  }
  if (attempts === 3) {
    // Alternated letters (1st, 3rd, 5th...)
    const alternated = word
      .split('')
      .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : '_'))
      .join(' ')
    return { type: 'alternated', value: alternated }
  }
  // Revealed
  return { type: 'revealed', value: word.toUpperCase() }
}

export function useExercise(words) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [hint, setHint] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0, failedWords: [] })
  const [isFinished, setIsFinished] = useState(false)
  const [lastResult, setLastResult] = useState(null) // 'correct' | 'wrong'
  const [isPlaying, setIsPlaying] = useState(false)
  const inputRef = useRef(null)

  const currentWord = words[currentWordIndex] || ''

  const playCurrentWord = useCallback(async () => {
    if (isPlaying) return
    setIsPlaying(true)
    await playAudio(currentWord)
    setIsPlaying(false)
  }, [currentWord, isPlaying])

  const nextWord = useCallback(
    (correct) => {
      const nextIndex = currentWordIndex + 1

      if (nextIndex >= words.length) {
        // Done
        setIsFinished(true)
      } else {
        setCurrentWordIndex(nextIndex)
        setAttempts(0)
        setHint(null)
        setLastResult(null)
        // Auto-play next word after short delay
        setTimeout(async () => {
          setIsPlaying(true)
          await playAudio(words[nextIndex])
          setIsPlaying(false)
          if (inputRef.current) inputRef.current.focus()
        }, 600)
      }
    },
    [currentWordIndex, words]
  )

  const onSubmit = useCallback(
    (answer) => {
      const normalizedAnswer = answer.toLowerCase().trim()
      const normalizedWord = currentWord.toLowerCase().trim()

      if (normalizedAnswer === normalizedWord) {
        // Correct
        setScore((prev) => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }))
        setLastResult('correct')
        setTimeout(() => nextWord(true), 800)
      } else {
        // Wrong
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setHearts((prev) => Math.max(0, prev - 1))
        setLastResult('wrong')

        if (newAttempts >= MAX_ATTEMPTS) {
          // No more attempts for this word
          setScore((prev) => ({
            ...prev,
            total: prev.total + 1,
            failedWords: [...prev.failedWords, currentWord],
          }))
          setHint({ type: 'revealed', value: currentWord.toUpperCase() })
          setTimeout(() => nextWord(false), 1500)
        } else {
          // Update hint
          setHint(getHint(currentWord, newAttempts))
          setTimeout(() => {
            setLastResult(null)
            if (inputRef.current) inputRef.current.focus()
          }, 600)
        }
      }
    },
    [currentWord, attempts, nextWord]
  )

  const getScorePct = useCallback(() => {
    if (score.total === 0) return 0
    return Math.round((score.correct / score.total) * 100)
  }, [score])

  const getStars = useCallback(() => {
    const pct = getScorePct()
    if (pct === 100) return 3
    if (pct >= 80) return 3
    if (pct >= 60) return 2
    if (pct >= 40) return 1
    return 0
  }, [getScorePct])

  const restart = useCallback(() => {
    setCurrentWordIndex(0)
    setAttempts(0)
    setHearts(MAX_HEARTS)
    setHint(null)
    setScore({ correct: 0, total: 0, failedWords: [] })
    setIsFinished(false)
    setLastResult(null)
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
    progress: words.length > 0 ? currentWordIndex / words.length : 0,
  }
}
