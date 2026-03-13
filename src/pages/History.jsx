import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWordListByChild, getScoresByChild, formatWeekStart } from '../services/storage'
import { getDayLabel, getDayEmoji } from '../services/planning'
import BottomNav from '../components/BottomNav'
import Stars from '../components/Stars'

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'weekend']

export default function History() {
  const navigate = useNavigate()
  const { activeChild } = useAuth()
  const [wordLists, setWordLists] = useState([])
  const [scores, setScores] = useState([])
  const [expandedWeek, setExpandedWeek] = useState(null)

  useEffect(() => {
    if (!activeChild) return
    const wls = getWordListByChild(activeChild.id)
    // Sort by most recent first
    wls.sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))
    setWordLists(wls)
    setScores(getScoresByChild(activeChild.id))
  }, [activeChild])

  if (!activeChild) {
    navigate('/')
    return null
  }

  function getScoreForDay(wordListId, day) {
    return scores.find((s) => s.wordListId === wordListId && s.day === day)
  }

  function getWeekAverage(wordListId) {
    const weekScores = scores.filter((s) => s.wordListId === wordListId && s.day !== 'weekend')
    if (weekScores.length === 0) return null
    return Math.round(weekScores.reduce((a, b) => a + b.scorePct, 0) / weekScores.length)
  }

  function getTotalStars(wordListId) {
    const weekScores = scores.filter((s) => s.wordListId === wordListId)
    return weekScores.reduce((a, b) => a + (b.stars || 0), 0)
  }

  return (
    <div className="app-container">
      <div className="page" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>📊 Mon Historique</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {activeChild.avatar} {activeChild.name}
          </p>
        </div>

        {wordLists.length === 0 && (
          <div className="empty-state">
            <span className="emoji">🕐</span>
            <p>Aucune dictée enregistrée pour l'instant. Commence ta première dictée !</p>
          </div>
        )}

        {wordLists.map((wl) => {
          const avg = getWeekAverage(wl.id)
          const totalStars = getTotalStars(wl.id)
          const isExpanded = expandedWeek === wl.id
          const completedDays = DAYS_ORDER.filter((d) => getScoreForDay(wl.id, d)).length

          return (
            <div
              key={wl.id}
              className="card"
              style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}
            >
              {/* Week header */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : wl.id)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: 'var(--font)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                  }}
                >
                  📅
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>
                    Semaine du {formatWeekStart(wl.weekStart)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{wl.words.length} mots</span>
                    {avg !== null && (
                      <span className={`badge ${avg >= 80 ? 'badge-success' : avg >= 60 ? 'badge-warning' : 'badge-error'}`}>
                        {avg}% moy.
                      </span>
                    )}
                    {totalStars > 0 && (
                      <span className="badge badge-warning">{'⭐'.repeat(Math.min(totalStars, 5))}</span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  className="animate-slideDown"
                  style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}
                >
                  {/* Day-by-day scores */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {DAYS_ORDER.map((day) => {
                      const sc = getScoreForDay(wl.id, day)
                      const dayWords = wl.planning?.[day] || []
                      return (
                        <div
                          key={day}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: sc
                              ? sc.scorePct >= 80
                                ? 'var(--success-light)'
                                : sc.scorePct >= 60
                                  ? 'var(--warning-light)'
                                  : 'var(--error-light)'
                              : 'var(--bg)',
                            opacity: dayWords.length === 0 ? 0.5 : 1,
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{getDayEmoji(day)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                              {getDayLabel(day)}
                              {day === 'weekend' && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--warning)' }}>RÉVISION</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {dayWords.length} mot{dayWords.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          {sc ? (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: 16 }}>{sc.scorePct}%</div>
                              <div style={{ fontSize: 14 }}>{'⭐'.repeat(sc.stars)}</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                              {dayWords.length > 0 ? '—' : 'Libre'}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Words list */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      TOUS LES MOTS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {wl.words.map((w) => (
                        <span
                          key={w}
                          style={{
                            background: '#EEF2FF',
                            color: 'var(--primary)',
                            padding: '4px 12px',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
