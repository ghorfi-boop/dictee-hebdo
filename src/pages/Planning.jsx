import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { generatePlanning, getDayLabel, getDayEmoji, getOrderedDays } from '../services/planning'
import { updateWordListPlanning, markAudioCached, getWordLists } from '../services/storage'
import { preGenerateAll } from '../services/tts'
import WordChip from '../components/WordChip'

export default function Planning() {
  const navigate = useNavigate()
  const location = useLocation()
  const { wordListId, childId } = location.state || {}

  const [wordList, setWordList] = useState(null)
  const [planning, setPlanning] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioTotal, setAudioTotal] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!wordListId) { navigate('/parent'); return }
    const lists = getWordLists()
    const wl = lists.find((w) => w.id === wordListId)
    if (!wl) { navigate('/parent'); return }
    setWordList(wl)
    // Generate or restore planning
    if (wl.planning) {
      setPlanning(wl.planning)
      setIsReady(true)
    } else {
      const p = generatePlanning(wl.words)
      setPlanning(p)
    }
  }, [wordListId])

  async function handleValidate() {
    if (!wordList || !planning) return
    setIsGenerating(true)
    setError('')

    // Save planning
    updateWordListPlanning(wordListId, planning)

    // Pre-generate audio
    const allWords = wordList.words
    setAudioTotal(allWords.length)
    setAudioProgress(0)

    try {
      await preGenerateAll(allWords, (done, total) => {
        setAudioProgress(done)
        setAudioTotal(total)
      })
      markAudioCached(wordListId)
    } catch (err) {
      console.warn('Audio pre-generation partial failure:', err)
    }

    setIsGenerating(false)
    setIsReady(true)
  }

  function handleGoToDashboard() {
    navigate('/parent')
  }

  if (!planning) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  const days = getOrderedDays()

  return (
    <div className="app-container">
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1 className="page-title">Planning de la semaine</h1>
        </div>

        {/* Summary */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', marginBottom: 20, border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>
                {wordList?.words?.length || 0} mots au total
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                Répartis sur 5 jours + révision week-end
              </div>
            </div>
            <span style={{ fontSize: 40 }}>📅</span>
          </div>
        </div>

        {/* Days */}
        {days.map((day) => {
          const dayWords = planning[day] || []
          const isWeekend = day === 'weekend'
          return (
            <div key={day} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: dayWords.length > 0 ? 12 : 0 }}>
                <span style={{ fontSize: 24 }}>{getDayEmoji(day)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {getDayLabel(day)}
                    {isWeekend && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--warning)', fontWeight: 700 }}>RÉVISION</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {dayWords.length} mot{dayWords.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {dayWords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {dayWords.map((w) => (
                    <WordChip key={w} word={w} size="small" status={isWeekend ? 'warning' : 'normal'} />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Audio generation progress */}
        {isGenerating && (
          <div className="card animate-slideDown" style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="spinner" />
              <div>
                <div style={{ fontWeight: 700 }}>Génération de l'audio...</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {audioProgress} / {audioTotal} mots
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: audioTotal ? `${(audioProgress / audioTotal) * 100}%` : '0%',
                  height: '100%',
                  background: 'var(--primary)',
                  borderRadius: 20,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {!isReady ? (
            <button
              className="btn btn-primary btn-full"
              onClick={handleValidate}
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ Génération audio...' : '✅ Valider et générer l\'audio'}
            </button>
          ) : (
            <>
              <div className="alert alert-success">
                🎉 Planning validé ! L'audio est prêt. L'enfant peut commencer sa dictée.
              </div>
              <button className="btn btn-primary btn-full" onClick={handleGoToDashboard}>
                ← Retour au tableau de bord
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
