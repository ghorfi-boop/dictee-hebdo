import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWordListHistory, getAllScores, formatWeekStart } from '../services/db'
import { getDayLabel, getDayEmoji } from '../services/planning'
import BottomNav from '../components/BottomNav'
import Stars from '../components/Stars'

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'weekend_review']

export default function History() {
  const navigate = useNavigate()
  const { activeChild } = useAuth()
  const [wordLists, setWordLists] = useState([])
  const [scores, setScores] = useState([])
  const [expandedWeek, setExpandedWeek] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!activeChild) return
    loadHistory()
  }, [activeChild])

  async function loadHistory() {
    try {
      const [wls, allScores] = await Promise.all([
        getWordListHistory(activeChild.id),
        getAllScores(activeChild.id),
      ])
      setWordLists(wls)
      setScores(allScores)
    } catch (err) {
      console.error('History load error:', err)
    }
    setIsLoading(false)
  }

  if (!activeChild) {
    navigate('/')
    return null
  }

  function getScoreForDay(wordListId, day) {
    return scores.find((s) => s.word_list_id === wordListId && s.day === day)
  }

  function getWeekAverage(wordListId) {
    const weekScores = scores.filter((s) => s.word_list_id === wordListId && s.day !== 'weekend_review')
    if (weekScores.length === 0) return null
    return Math.round(weekScores.reduce((a, b) => a + b.score_pct, 0) / weekScores.length)
  }

  function getTotalStars(wordListId) {
    const weekScores = scores.filter((s) => s.word_list_id === wordListId)
    return weekScores.reduce((a, b) => a + (b.stars || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="page" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>📊 Mon Historique</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {activeChild.avatar} {activeChild.display_name}
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
                    Semaine du {formatWeekStart(wl.week_start)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{wl.words?.length || 0} mots</span>
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
                      const isWeekendDay = day === 'weekend_review'
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
                              ? sc.score_pct >= 80
                                ? 'var(--success-light)'
                                : sc.score_pct >= 60
                                  ? 'var(--warning-light)'
                                  : 'var(--error-light)'
                              : 'var(--bg)',
                            opacity: dayWords.length === 0 && !isWeekendDay ? 0.5 : 1,
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{getDayEmoji(day)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                              {getDayLabel(day)}
                              {isWeekendDay && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--warning)' }}>RÉVISION</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {dayWords.length} mot{dayWords.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          {sc ? (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: 16 }}>{sc.score_pct}%</div>
                              <div style={{ fontSize: 14 }}>{'⭐'.repeat(sc.stars)}</div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                              {dayWords.length > 0 || isWeekendDay ? '—' : 'Libre'}
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
                      {(wl.words || []).map((w) => (
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
