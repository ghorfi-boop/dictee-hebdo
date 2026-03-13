import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getCurrentWordList,
  getScores,
  getCurrentDayKey,
  getThisWeekStart,
  formatWeekStart,
} from '../services/storage'
import { getDayLabel, getDayEmoji, getOrderedDays, isWeekend } from '../services/planning'
import BottomNav from '../components/BottomNav'
import ProgressBar from '../components/ProgressBar'

export default function ChildHome() {
  const navigate = useNavigate()
  const { activeChild } = useAuth()
  const [wordList, setWordList] = useState(null)
  const [scores, setScores] = useState([])
  const [currentDayKey, setCurrentDayKey] = useState(getCurrentDayKey())
  const [todayDone, setTodayDone] = useState(false)

  useEffect(() => {
    if (!activeChild) return
    const wl = getCurrentWordList(activeChild.id)
    setWordList(wl)
    const allScores = getScores().filter((s) => s.childId === activeChild.id)
    setScores(allScores)
    const dayKey = getCurrentDayKey()
    setCurrentDayKey(dayKey)
    if (wl) {
      const todayScore = allScores.find((s) => s.wordListId === wl.id && s.day === dayKey)
      setTodayDone(!!todayScore)
    }
  }, [activeChild])

  if (!activeChild) {
    navigate('/')
    return null
  }

  function getTodayWords() {
    if (!wordList?.planning) return []
    return wordList.planning[currentDayKey] || []
  }

  function getDayScore(day) {
    if (!wordList) return null
    return scores.find((s) => s.wordListId === wordList.id && s.day === day)
  }

  function getCompletedDays() {
    if (!wordList) return 0
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    return days.filter((d) => scores.find((s) => s.wordListId === wordList.id && s.day === d)).length
  }

  function handleStartExercise() {
    if (!wordList) return
    const words = getTodayWords()
    navigate('/exercise', {
      state: {
        wordListId: wordList.id,
        childId: activeChild.id,
        day: currentDayKey,
        words,
      },
    })
  }

  const todayWords = getTodayWords()
  const todayScore = wordList ? getDayScore(currentDayKey) : null
  const completedDays = getCompletedDays()
  const week = isWeekend()
  const hasWords = todayWords.length > 0

  return (
    <div className="app-container">
      <div className="page" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 14 }}>Bonjour</p>
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>
            {activeChild.avatar} {activeChild.name} !
          </h1>
          {wordList && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Semaine du {formatWeekStart(wordList.weekStart)}
            </p>
          )}
        </div>

        {/* No word list */}
        {!wordList && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😴</div>
            <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Pas de dictée cette semaine</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Dis à ton parent de préparer ta liste de mots !
            </p>
          </div>
        )}

        {/* Has word list */}
        {wordList && (
          <>
            {/* Weekly progress */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Ma semaine</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {completedDays}/5 jours
                </span>
              </div>
              <ProgressBar value={completedDays} max={5} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                  const score = getDayScore(day)
                  const isToday = day === currentDayKey && !week
                  return (
                    <div key={day} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 800,
                          border: isToday ? '3px solid var(--primary)' : '3px solid transparent',
                          background: score
                            ? score.scorePct >= 80
                              ? 'var(--success-light)'
                              : score.scorePct >= 60
                                ? 'var(--warning-light)'
                                : 'var(--error-light)'
                            : 'var(--bg)',
                          color: score ? 'var(--text)' : 'var(--text-muted)',
                          margin: '0 auto 4px',
                        }}
                      >
                        {score ? `${score.stars}⭐`.slice(0, 2) : getDayEmoji(day)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
                        {getDayLabel(day).slice(0, 3)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Today's exercise */}
            {week ? (
              // Weekend: revision mode
              <div className="card" style={{ marginBottom: 16, border: '2px solid var(--warning)', background: 'var(--warning-light)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ fontSize: 40 }}>🏆</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Révision Week-end !</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
                      Tous les {wordList.words.length} mots de la semaine
                    </div>
                  </div>
                </div>
                {getDayScore('weekend') ? (
                  <div>
                    <div className="alert alert-success" style={{ marginBottom: 12 }}>
                      ✅ Révision terminée ! Score: {getDayScore('weekend').scorePct}%
                    </div>
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => navigate('/exercise', {
                        state: {
                          wordListId: wordList.id,
                          childId: activeChild.id,
                          day: 'weekend',
                          words: [...wordList.words].sort(() => Math.random() - 0.5),
                        },
                      })}
                    >
                      🔄 Recommencer la révision
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-full"
                    style={{ background: 'var(--warning)', color: 'white', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}
                    onClick={() => navigate('/exercise', {
                      state: {
                        wordListId: wordList.id,
                        childId: activeChild.id,
                        day: 'weekend',
                        words: [...wordList.words].sort(() => Math.random() - 0.5),
                      },
                    })}
                  >
                    C'est parti ! 🚀
                  </button>
                )}
              </div>
            ) : hasWords ? (
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ fontSize: 36 }}>{getDayEmoji(currentDayKey)}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>
                      {getDayLabel(currentDayKey)}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
                      {todayWords.length} mot{todayWords.length > 1 ? 's' : ''} à apprendre
                    </div>
                  </div>
                </div>

                {todayDone ? (
                  <div>
                    <div className="alert alert-success" style={{ marginBottom: 12 }}>
                      ✅ Super ! Tu as déjà fait ta dictée aujourd'hui !
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 32 }}>
                        {'⭐'.repeat(todayScore?.stars || 0)}
                      </span>
                      <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>
                        Score : {todayScore?.scorePct}%
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-full" onClick={handleStartExercise}>
                      🔄 Recommencer
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-full animate-pulse" onClick={handleStartExercise}>
                    Commencer la dictée 🎤
                  </button>
                )}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Pas de dictée aujourd'hui !</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Profite de ta journée 😊</div>
              </div>
            )}

            {/* Words preview */}
            {hasWords && !week && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
                  LES MOTS DU JOUR
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {todayWords.map((w) => (
                    <span
                      key={w}
                      style={{
                        background: '#EEF2FF',
                        color: 'var(--primary)',
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 15,
                        fontWeight: 700,
                        filter: todayDone ? 'none' : 'blur(6px)',
                        transition: 'filter 0.3s',
                      }}
                      title={todayDone ? w : 'Fais ta dictée d\'abord !'}
                    >
                      {w}
                    </span>
                  ))}
                </div>
                {!todayDone && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                    Les mots sont masqués — fais ta dictée d'abord !
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
