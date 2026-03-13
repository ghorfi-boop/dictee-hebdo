import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getChildren,
  createChild,
  deleteChild,
  getChildStats,
  getCurrentWordList,
} from '../services/storage'

const AVATARS = ['👦', '👧', '🧒', '👶', '🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐯', '🐸', '🐧', '🦋', '⭐', '🌈', '🚀', '🎮', '🎵', '🌟']

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { parent, logoutParent } = useAuth()
  const [children, setChildren] = useState(getChildren())
  const [showAddChild, setShowAddChild] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState('👦')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function handleAddChild(e) {
    e.preventDefault()
    setError('')
    if (!newName.trim()) { setError('Prénom requis.'); return }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setError('PIN : 4 chiffres.'); return }
    if (newPin !== confirmPin) { setError('Les PINs ne correspondent pas.'); return }
    createChild({ name: newName.trim(), avatar: newAvatar, pin: newPin })
    setChildren(getChildren())
    setShowAddChild(false)
    setNewName('')
    setNewPin('')
    setConfirmPin('')
    setNewAvatar('👦')
  }

  function handleDelete(childId) {
    deleteChild(childId)
    setChildren(getChildren())
    setDeleteConfirm(null)
  }

  function handleSelectChild(child) {
    navigate('/words', { state: { childId: child.id } })
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        padding: '24px 20px 32px',
        color: 'white',
        borderRadius: '0 0 32px 32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 14, opacity: 0.8, fontWeight: 600 }}>Bonjour 👋</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>Tableau de bord</h1>
          </div>
          <button
            onClick={logoutParent}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 12,
              padding: '8px 14px',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Déconnexion
          </button>
        </div>
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>{parent?.email}</span>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 24 }}>
        {/* Children */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Mes enfants</h2>
          <button
            onClick={() => { setShowAddChild(true); setError('') }}
            className="btn btn-primary"
            style={{ minHeight: 40, padding: '8px 16px', fontSize: 14 }}
          >
            + Ajouter
          </button>
        </div>

        {children.length === 0 && !showAddChild && (
          <div className="empty-state">
            <span className="emoji">👨‍👩‍👧</span>
            <p>Ajoutez un profil enfant pour commencer !</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {children.map((child) => {
            const stats = getChildStats(child.id)
            const currentWL = getCurrentWordList(child.id)
            return (
              <div
                key={child.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                onClick={() => handleSelectChild(child)}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  background: '#EEF2FF',
                  borderRadius: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  flexShrink: 0,
                }}>
                  {child.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{child.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                    {currentWL
                      ? `${currentWL.words.length} mots cette semaine`
                      : 'Pas de liste cette semaine'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span className="badge badge-primary">{stats.totalSessions} sessions</span>
                    {stats.avgScore > 0 && (
                      <span className="badge badge-success">{stats.avgScore}% moy.</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/words', { state: { childId: child.id } }) }}
                    className="btn btn-primary"
                    style={{ minHeight: 36, padding: '6px 14px', fontSize: 13 }}
                  >
                    📝 Mots
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(child.id) }}
                    className="btn btn-ghost"
                    style={{ minHeight: 32, padding: '4px 10px', fontSize: 12, color: 'var(--error)' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Child Form */}
        {showAddChild && (
          <div className="card animate-slideDown" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Nouveau profil</h3>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Marie"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div className="avatar-grid">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setNewAvatar(av)}
                    className={`avatar-option ${newAvatar === av ? 'selected' : ''}`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Code PIN (4 chiffres)</label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
                placeholder="****"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le PIN</label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.slice(0, 4))}
                placeholder="****"
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={handleAddChild} className="btn btn-success" style={{ flex: 1 }}>
                Créer le profil
              </button>
              <button
                onClick={() => { setShowAddChild(false); setError('') }}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Quick tips */}
        {children.length > 0 && (
          <div className="card" style={{ background: '#EEF2FF', border: 'none' }}>
            <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, color: 'var(--primary)' }}>
              💡 Comment ça marche ?
            </h3>
            <ol style={{ paddingLeft: 18, color: 'var(--text-muted)', fontSize: 14, lineHeight: 2 }}>
              <li>Cliquez sur un enfant → <strong>📝 Mots</strong></li>
              <li>Saisissez les mots (photo ou manuel)</li>
              <li>Validez le planning → audio généré</li>
              <li>L'enfant fait sa dictée chaque jour !</li>
            </ol>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="card animate-pop"
            style={{ maxWidth: 340, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48 }}>⚠️</div>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>Supprimer ce profil ?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
                Toutes les données (mots, scores, historique) seront perdues.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-danger" style={{ flex: 1 }}>
                Supprimer
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
