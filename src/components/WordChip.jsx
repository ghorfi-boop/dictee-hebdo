export default function WordChip({ word, status = 'normal', onRemove, size = 'normal' }) {
  const colors = {
    normal: { bg: '#EEF2FF', color: 'var(--primary)', border: '#C7D2FE' },
    success: { bg: 'var(--success-light)', color: '#065F46', border: '#6EE7B7' },
    error: { bg: 'var(--error-light)', color: '#991B1B', border: '#FCA5A5' },
    warning: { bg: 'var(--warning-light)', color: '#92400E', border: '#FCD34D' },
  }

  const style = colors[status] || colors.normal
  const isSmall = size === 'small'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: isSmall ? '4px 10px' : '6px 14px',
        borderRadius: 20,
        background: style.bg,
        color: style.color,
        border: `2px solid ${style.border}`,
        fontSize: isSmall ? 13 : 15,
        fontWeight: 700,
        fontFamily: 'var(--font)',
        transition: 'all 0.2s',
      }}
    >
      {word}
      {onRemove && (
        <button
          onClick={() => onRemove(word)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            background: 'rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: 10,
            color: style.color,
            padding: 0,
          }}
        >
          ✕
        </button>
      )}
    </span>
  )
}
