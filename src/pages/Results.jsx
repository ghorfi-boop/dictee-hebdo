import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { saveScore } from '../services/db'
import Stars from '../components/Stars'
import Confetti from '../components/Confetti'
import WordChip from '../components/WordChip'

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    wordListId,
    childId,
    day,
    scorePct,
    stars,
    failedWords = [],
    correct,
    total,
    words,
  } = location.state || {}

  const [saved, setSaved] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (!wordListId || !childId || !day) {
      navigate('/child')
      return
    }
    // Save score to Supabase
    saveScore(childId, wordListId, day, {
      scorePct,
      stars,
      failedWords,
      attempts: total,
    }).then(() => {
      setSaved(true)
    }).catch((err) => {
      console.warn('Score save failed:', err)
      setSaved(true) // Still show results even if save fails
    })

    // Confetti if perfect
    if (scorePct === 100) {
      setShowConfetti(true)
    }
  }, [])

  if (!wordListId) return null

  function getMessage() {
    if (scorePct === 100) return { emoji: '🏆', text: "PARFAIT ! Tu es le champion !", color: 'var(--success)' }
    if (scorePct >= 80) return { emoji: '⭐', text: 'Excellent travail !', color: 'var(--primary)' }
    if (scorePct >= 60) return { emoji: '👍', text: 'Bon travail, continue !', color: 'var(--warning)' }
    if (scorePct >= 40) return { emoji: '💪', text: 'Continue à pratiquer !', color: 'var(--warning)' }
    return { emoji: '📚', text: 'Revois les mots et réessaie !', color: 'var(--error)' }
  }

  const msg = getMessage()

  function handleRestart() {
    const shuffled = [...(words || [])].sort(() => Math.random() - 0.5)
    navigate('/exercise', {
      state: { wordListId, childId, day, words: shuffled },
      replace: true,
    })
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
      <Confetti active={showConfetti} />
      <div style={{ width: '100%', maxWidth: 400, padding: 24 }}>

        {/* Score card */}
        <div
          className="card animate-pop"
          style={{ textAlign: 'center', padding: 36, marginBottom: 20 }}
        >
          <div style={{ fontSize: 64, marginBottom: 12 }}>{msg.emoji}</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: msg.color, marginBottom: 8 }}>
            {msg.text}
          </h1>

          {/* Big score */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: msg.color,
              lineHeight: 1,
              margin: '16px 0',
            }}
          >
            {scorePct}<span style={{ fontSize: 28 }}>%</span>
          </div>

          {/* Stars */}
          <div style={{ margin: '16px 0' }}>
            <Stars count={stars} animated />
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              padding: '16px 0',
              borderTop: '1px solid var(--border)',
              marginTop: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>{correct}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>réussis</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--error)' }}>{failedWords.length}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>ratés</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{total}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>total</div>
            </div>
          </div>
        </div>

        {/* Failed words */}
        {failedWords.length > 0 && (
          <div className="card animate-slideDown" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: 'var(--error)' }}>
              📝 Mots à retravailler
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {failedWords.map((w) => (
                <WordChip key={w} word={w} status="error" />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate('/child')}
            className="btn btn-primary btn-full"
          >
            🏠 Retour à l'accueil
          </button>
          <button
            onClick={handleRestart}
            className="btn btn-secondary btn-full"
          >
            🔄 Recommencer à zéro
          </button>
        </div>
      </div>
    </div>
  )
}
