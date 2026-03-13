import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useExercise } from '../hooks/useExercise'
import Hearts from '../components/Hearts'
import ProgressBar from '../components/ProgressBar'

export default function Exercise() {
  const navigate = useNavigate()
  const location = useLocation()
  const { wordListId, childId, day, words } = location.state || {}

  const [answer, setAnswer] = useState('')
  const [shakeInput, setShakeInput] = useState(false)
  const inputRef = useRef()

  const {
    currentWordIndex,
    currentWord,
    hearts,
    maxHearts,
    hint,
    score,
    isFinished,
    lastResult,
    isPlaying,
    onSubmit,
    playCurrentWord,
    progress,
    getScorePct,
    getStars,
  } = useExercise(words || [])

  // Auto-play first word on mount
  useEffect(() => {
    if (words && words.length > 0) {
      const timer = setTimeout(async () => {
        await playCurrentWord()
        inputRef.current?.focus()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // Navigate to results when finished
  useEffect(() => {
    if (isFinished) {
      setTimeout(() => {
        navigate('/results', {
          state: {
            wordListId,
            childId,
            day,
            scorePct: getScorePct(),
            stars: getStars(),
            failedWords: score.failedWords,
            correct: score.correct,
            total: score.total,
            words,
          },
          replace: true,
        })
      }, 300)
    }
  }, [isFinished])

  if (!words || words.length === 0) {
    navigate('/child')
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!answer.trim()) return
    const prevResult = lastResult
    onSubmit(answer)
    setAnswer('')
    // Check if wrong to shake
    if (prevResult !== 'correct') {
      setShakeInput(true)
      setTimeout(() => setShakeInput(false), 500)
    }
  }

  function handlePlayWord() {
    playCurrentWord()
  }

  return (
    <div className="app-container" style={{ background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, paddingBottom: 30 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button
            onClick={() => navigate('/child')}
            style={{
              background: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            ✕ Quitter
          </button>
          <Hearts current={hearts} max={maxHearts} />
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 24 }}>
          <ProgressBar
            value={currentWordIndex}
            max={words.length}
            label={`Mot ${currentWordIndex + 1} sur ${words.length}`}
          />
        </div>

        {/* Main card */}
        <div
          className="card"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            textAlign: 'center',
            minHeight: 320,
          }}
        >
          {/* Speaker button */}
          <button
            onClick={handlePlayWord}
            disabled={isPlaying}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: isPlaying
                ? 'var(--success-light)'
                : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              border: 'none',
              cursor: isPlaying ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              boxShadow: isPlaying
                ? 'none'
                : '0 8px 24px rgba(108, 99, 255, 0.4)',
              transition: 'all 0.3s ease',
              marginBottom: 24,
              animation: isPlaying ? 'pulse 1s ease infinite' : 'none',
            }}
          >
            {isPlaying ? '🔊' : '🔈'}
          </button>

          <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {isPlaying ? 'Écoute bien...' : 'Appuie pour écouter le mot'}
          </p>

          {/* Hint */}
          {hint && (
            <div
              className="animate-slideDown"
              style={{
                marginTop: 16,
                padding: '12px 20px',
                borderRadius: 14,
                background: hint.type === 'revealed' ? '#FEE2E2' : '#FEF9C3',
                color: hint.type === 'revealed' ? '#991B1B' : '#78350F',
                fontWeight: 800,
                fontSize: hint.type === 'revealed' ? 24 : 16,
                letterSpacing: ['alternated', 'vowels', 'length'].includes(hint.type) ? 3 : 0,
                fontFamily: ['alternated', 'vowels', 'length'].includes(hint.type) ? 'monospace' : 'var(--font)',
              }}
            >
              {hint.type === 'revealed'
                ? `Le mot était : ${hint.label}`
                : `💡 ${hint.label}`}
            </div>
          )}

          {/* Result feedback */}
          {lastResult === 'correct' && (
            <div className="animate-pop" style={{ marginTop: 16, fontSize: 32 }}>✅</div>
          )}
          {lastResult === 'wrong' && (
            <div className="animate-shake" style={{ marginTop: 16, fontSize: 32 }}>❌</div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              ref={inputRef}
              type="text"
              className={`input ${shakeInput && lastResult === 'wrong' ? 'animate-shake' : ''}`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Écris le mot ici..."
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: 700,
                borderColor:
                  lastResult === 'correct'
                    ? 'var(--success)'
                    : lastResult === 'wrong'
                      ? 'var(--error)'
                      : 'var(--border)',
                textAlign: 'center',
                transition: 'border-color 0.3s',
              }}
              disabled={isFinished}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: 60, fontSize: 20 }}
              disabled={!answer.trim() || isFinished}
            >
              ✓
            </button>
          </div>
          <button
            type="button"
            onClick={handlePlayWord}
            className="btn btn-secondary btn-full"
            style={{ marginTop: 10, fontSize: 15 }}
            disabled={isPlaying}
          >
            {isPlaying ? '🔊 Écoute...' : '🔄 Réécouter le mot'}
          </button>
        </form>

        {/* Attempts indicator */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            {4 - hearts} erreur{4 - hearts !== 1 ? 's' : ''} sur ce mot
          </span>
        </div>
      </div>
    </div>
  )
}
