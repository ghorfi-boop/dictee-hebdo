import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { path: '/child', icon: '🏠', label: 'Accueil' },
  { path: '/history', icon: '📊', label: 'Historique' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logoutChild, activeChild } = useAuth()

  const isActive = (path) => location.pathname === path

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'white',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 16px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 20px',
            borderRadius: 12,
            transition: 'all 0.2s',
            backgroundColor: isActive(item.path) ? '#EEF2FF' : 'transparent',
          }}
        >
          <span style={{ fontSize: 24 }}>{item.icon}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: isActive(item.path) ? 'var(--primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font)',
            }}
          >
            {item.label}
          </span>
        </button>
      ))}

      {/* Child avatar / Switch */}
      <button
        onClick={logoutChild}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>{activeChild?.avatar || '👤'}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font)',
          }}
        >
          Changer
        </span>
      </button>
    </nav>
  )
}
