import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { recognizeFromFile } from '../services/ocr'
import WordChip from '../components/WordChip'

export default function WordCapture() {
  const navigate = useNavigate()
  const location = useLocation()
  const childId = location.state?.childId

  const [mode, setMode] = useState(null) // 'photo' | 'manual'
  const [words, setWords] = useState([])
  const [manualInput, setManualInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef()

  if (!childId) {
    navigate('/parent')
    return null
  }

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setIsProcessing(true)
    setError('')
    setProgress(0)
    try {
      const extracted = await recognizeFromFile(file, setProgress)
      if (extracted.length === 0) {
        setError("Aucun mot détecté. Essayez avec une meilleure photo ou saisissez manuellement.")
      } else {
        setWords((prev) => [...new Set([...prev, ...extracted])])
      }
    } catch (err) {
      setError("Erreur lors de la reconnaissance. Essayez en saisie manuelle.")
      console.error(err)
    }
    setIsProcessing(false)
    setProgress(0)
  }

  function handleAddManual() {
    if (!manualInput.trim()) return
    const newWords = manualInput
      .split(/[\s,;]+/)
      .map((w) => w.toLowerCase().trim().replace(/[^a-zàâäéèêëîïôùûüçœæ'-]/g, ''))
      .filter((w) => w.length >= 2)
    setWords((prev) => [...new Set([...prev, ...newWords])])
    setManualInput('')
  }

  function handleRemove(word) {
    setWords((prev) => prev.filter((w) => w !== word))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddManual()
    }
  }

  function handleContinue() {
    if (words.length === 0) {
      setError("Ajoutez au moins un mot avant de continuer.")
      return
    }
    navigate('/verify', { state: { childId, words } })
  }

  return (
    <div className="app-container">
      <div className="page">
        {/* Header */}
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/parent')}>←</button>
          <h1 className="page-title">Saisie des mots</h1>
        </div>

        {/* Mode Selection */}
        {!mode && (
          <div className="animate-fadeIn">
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontWeight: 600 }}>
              Comment veux-tu saisir les mots de la dictée ?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button
                className="card"
                onClick={() => { setMode('photo'); setTimeout(() => fileRef.current?.click(), 100) }}
                style={{
                  border: '2px dashed var(--border)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: 32,
                  transition: 'all 0.2s',
                  background: 'white',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Photo</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                  Prends en photo la liste de mots
                </div>
              </button>
              <button
                className="card"
                onClick={() => setMode('manual')}
                style={{
                  border: '2px dashed var(--border)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: 32,
                  transition: 'all 0.2s',
                  background: 'white',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>⌨️</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Saisie manuelle</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                  Tape les mots un par un
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handlePhoto}
        />

        {/* Processing */}
        {isProcessing && (
          <div style={{ textAlign: 'center', padding: 40 }} className="animate-fadeIn">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Analyse en cours...</p>
            <div style={{ background: 'var(--border)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  borderRadius: 20,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>{progress}%</p>
          </div>
        )}

        {/* Mode: photo/manual with word list */}
        {(mode === 'photo' || mode === 'manual') && !isProcessing && (
          <div className="animate-fadeIn">
            {/* Manual Input */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Ajouter des mots</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="input"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ex: maison, voiture..."
                  style={{ flex: 1 }}
                  autoFocus={mode === 'manual'}
                />
                <button onClick={handleAddManual} className="btn btn-primary" style={{ minWidth: 60 }}>
                  +
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Séparés par espace, virgule, ou Entrée
              </p>
            </div>

            {/* Photo button when in photo mode */}
            {mode === 'photo' && (
              <button
                className="btn btn-secondary btn-full"
                onClick={() => fileRef.current?.click()}
                style={{ marginBottom: 16 }}
              >
                📷 Nouvelle photo
              </button>
            )}

            {/* Error */}
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            {/* Words */}
            {words.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="form-label">{words.length} mot{words.length > 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setWords([])}
                    style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Tout effacer
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {words.map((w) => (
                    <WordChip key={w} word={w} onRemove={handleRemove} />
                  ))}
                </div>
              </div>
            )}

            {words.length === 0 && (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <span className="emoji">📝</span>
                <p>Aucun mot ajouté. Tapez des mots ci-dessus ou prenez une photo.</p>
              </div>
            )}

            <button
              className="btn btn-primary btn-full"
              onClick={handleContinue}
              disabled={words.length === 0}
            >
              Continuer → Vérifier les mots
            </button>
            <button
              className="btn btn-ghost btn-full"
              onClick={() => { setMode(null); setWords([]); setError('') }}
              style={{ marginTop: 8 }}
            >
              ← Retour
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
