import { useEffect, useState } from 'react'

export default function Stars({ count = 0, max = 3, size = 40, animated = true }) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (!animated) {
      setVisible(count)
      return
    }
    setVisible(0)
    const timers = []
    for (let i = 1; i <= count; i++) {
      timers.push(
        setTimeout(() => setVisible(i), i * 300)
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [count, animated])

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: size,
            transition: 'all 0.3s ease',
            filter: i < visible ? 'none' : 'grayscale(100%)',
            opacity: i < visible ? 1 : 0.25,
            transform: i < visible ? 'scale(1)' : 'scale(0.8)',
            display: 'inline-block',
            animation: i < visible && animated ? `pop 0.4s ease ${i * 0.3}s both` : 'none',
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}
