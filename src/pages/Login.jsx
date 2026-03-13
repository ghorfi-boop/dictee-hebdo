import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getParent,
  createParent,
  checkParentPassword,
  getChildren,
  checkChildPin,
} from '../services/storage'

const STEP = {
  CHOOSE: 'choose',         // Choose: parent or child
  PARENT_LOGIN: 'parent_login',
  PARENT_REGISTER: 'parent_register',
  CHILD_SELECT: 'child_select',
  CHILD_PIN: 'child_pin',
}

export default function Login() {
  const navigate = useNavigate()
  const { loginParent, loginChild } = useAuth()
  const [step, setStep] = useState(STEP.CHOOSE)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [selectedChild, setSelectedChild] = useState(null)
  const [pin, setPin] = useState(['', '', '', ''])
  const pinRefs = [useRef(), useRef(), useRef(), useRef()]

  const children = getChildren()
  const parent = getParent()

  function handlePinChange(idx, value) {
    if (!/^\d?$/.test(value)) return
    const next = [...pin]
    next[idx] = value
    setPin(next)
    if (value && idx < 3) {
      pinRefs[idx + 1].current?.focus()
    }
  }

  function handlePinKeyDown(idx, e) {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      pinRefs[idx - 1].current?.focus()
    }
  }

  function handleParentLogin(e) {
    e.preventDefault()
    setError('')
    if (!parent) {
      setError("Aucun compte parent trouvé. Créez un compte d'abord.")
      return
    }
    if (parent.email !== email) {
      setError('Email incorrect.')
      return
    }
    if (!checkParentPassword(password)) {
      setError('Mot de passe incorrect.')
      return
    }
    loginParent(parent)
    navigate('/parent')
  }

  function handleParentRegister(e) {
    e.preventDefault()
    setError('')
    if (parent) {
      setError('Un compte parent existe déjà. Connectez-vous.')
      return
    }
    if (!email || !password) {
      setError('Email et mot de passe requis.')
      return
    }
    if (password.length < 6) {
      setError('Mot de passe : 6 caractères minimum.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    const newParent = createParent({ email, password })
    loginParent(newParent)
    navigate('/parent')
  }

  function handleChildSelect(child) {
    setSelectedChild(child)
    setPin(['', '', '', ''])
    setError('')
    setStep(STEP.CHILD_PIN)
    setTimeout(() => pinRefs[0].current?.focus(), 100)
  }

  function handleChildPin(e) {
    e.preventDefault()
    const pinStr = pin.join('')
    if (pinStr.length !== 4) {
      setError('Entrez votre code PIN (4 chiffres).')
      return
    }
    if (!checkChildPin(selectedChild.id, pinStr)) {
      setError('Code PIN incorrect.')
      setPin(['', '', '', ''])
      setTimeout(() => pinRefs[0].current?.focus(), 100)
      return
    }
    loginChild(selectedChild)
    navigate('/child')
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>📚</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>
            Dictée Hebdo
          </h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>
            Apprendre les mots en s'amusant !
          </p>
        </div>

        {/* ── CHOOSE ─────────────────────────────────────── */}
        {step === STEP.CHOOSE && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fadeIn">
            {children.length > 0 && (
              <button
                className="btn btn-primary btn-full"
                onClick={() => setStep(STEP.CHILD_SELECT)}
                style={{ fontSize: 18 }}
              >
                👧 Je suis un enfant
              </button>
            )}
            <button
              className="btn btn-secondary btn-full"
              onClick={() => setStep(STEP.PARENT_LOGIN)}
              style={{ fontSize: 18 }}
            >
              👨‍👩‍👧 Connexion Parent
            </button>
            <button
              className="btn btn-full"
              onClick={() => setStep(STEP.PARENT_REGISTER)}
              style={{
                fontSize: 16,
                background: 'white',
                border: '2px solid var(--primary)',
                color: 'var(--primary)',
                fontWeight: 700,
                borderRadius: 16,
                minHeight: 52,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              ✨ Créer un compte parent
            </button>
          </div>
        )}

        {/* ── PARENT LOGIN ────────────────────────────────── */}
        {step === STEP.PARENT_LOGIN && (
          <form onSubmit={handleParentLogin} className="animate-fadeIn">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Connexion Parent</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Accès au tableau de bord</p>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
              Se connecter
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => { setStep(STEP.CHOOSE); setError('') }}
              style={{ marginTop: 8 }}
            >
              ← Retour
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Pas encore de compte ? </span>
              <button
                type="button"
                onClick={() => { setStep(STEP.PARENT_REGISTER); setError('') }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)' }}
              >
                Créer un compte
              </button>
            </div>
          </form>
        )}

        {/* ── PARENT REGISTER ─────────────────────────────── */}
        {step === STEP.PARENT_REGISTER && (
          <form onSubmit={handleParentRegister} className="animate-fadeIn">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Créer un compte</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Pour commencer à utiliser l'app</p>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 caractères"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
              Créer mon compte
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => { setStep(STEP.CHOOSE); setError('') }}
              style={{ marginTop: 8 }}
            >
              ← Retour
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Déjà un compte ? </span>
              <button
                type="button"
                onClick={() => { setStep(STEP.PARENT_LOGIN); setError('') }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)' }}
              >
                Se connecter
              </button>
            </div>
          </form>
        )}

        {/* ── CHILD SELECT ────────────────────────────────── */}
        {step === STEP.CHILD_SELECT && (
          <div className="animate-fadeIn">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Qui es-tu ?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Choisis ton profil</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    background: 'white',
                    border: '2px solid var(--border)',
                    borderRadius: 16,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span style={{ fontSize: 40 }}>{child.avatar}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{child.name}</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost btn-full"
              onClick={() => { setStep(STEP.CHOOSE); setError('') }}
              style={{ marginTop: 16 }}
            >
              ← Retour
            </button>
          </div>
        )}

        {/* ── CHILD PIN ───────────────────────────────────── */}
        {step === STEP.CHILD_PIN && selectedChild && (
          <form onSubmit={handleChildPin} className="animate-fadeIn">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>{selectedChild.avatar}</div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>Bonjour {selectedChild.name} !</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Entre ton code PIN secret</p>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="pin-input" style={{ marginBottom: 32 }}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="number"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value.slice(-1))}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="pin-digit"
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              C'est parti ! 🚀
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => { setStep(STEP.CHILD_SELECT); setError(''); setPin(['', '', '', '']) }}
              style={{ marginTop: 8 }}
            >
              ← Retour
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
