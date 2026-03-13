export default function ProgressBar({ value = 0, max = 1, color = 'var(--primary)', label = null }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-muted)',
          }}
        >
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: 10,
          background: 'var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 20,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}
