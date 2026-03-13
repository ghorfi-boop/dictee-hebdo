import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import WordChip from '../components/WordChip'
import { createWordList } from '../services/storage'

export default function WordVerify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { childId, words: initialWords } = location.state || {}

  const [words, setWords] = useState(initialWords || [])
  const [newWord, setNewWord] = useState('')
  const [error, setError] = useState('')

  if (!childId) {
    navigate('/parent')
    return null
  }

  function handleRemove(word) {
    setWords((prev) => prev.filter((w) => w !== word))
  }

  function handleAdd() {
    if (!newWord.trim()) return
    const clean = newWord.toLowerCase().trim()
    if (!words.includes(clean)) {
      setWords((prev) => [...prev, clean])
    }
    setNewWord('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
  }

  function handleValidate() {
    if (words.length === 0) {
      setError('Ajoutez au moins un mot.')
      return
    }
    const wl = createWordList({ childId, words })
    navigate('/planning', { state: { wordListId: wl.id, childId } })
  }

  return (
    <div className="app-container">
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1 className="page-title">Vérification</h1>
        </div>

        <div className="card animate-fadeIn" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>✅</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Voici les mots détectés</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Corrigez si nécessaire avant de valider
              </div>
            </div>
          </div>

          {/* Words display */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, minHeight: 60 }}>
            {words.length === 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucun mot — ajoutez-en ci-dessous</span>
            )}
            {words.map((w) => (
              <WordChip key={w} word={w} onRemove={handleRemove} />
            ))}
          </div>

          {/* Add word */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ajouter un mot..."
              style={{ flex: 1 }}
            />
            <button onClick={handleAdd} className="btn btn-secondary" style={{ minWidth: 52 }}>+</button>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{words.length}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>mots au total</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>
              {Math.ceil(words.length / 5)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>mots/jour (max)</div>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary btn-full" onClick={handleValidate}>
            🗓️ Créer le planning
          </button>
          <button className="btn btn-ghost btn-full" onClick={() => navigate(-1)}>
            ← Retour
          </button>
        </div>
      </div>
    </div>
  )
}
