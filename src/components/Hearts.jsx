import { useEffect, useRef, useState } from 'react'

export default function Hearts({ current, max = 4 }) {
  const prevRef = useRef(current)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (current < prevRef.current) {
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 500)
      prevRef.current = current
      return () => clearTimeout(t)
    }
    prevRef.current = current
  }, [current])

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
      }}
      className={shaking ? 'animate-shake' : ''}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 24,
            transition: 'all 0.3s ease',
            filter: i < current ? 'none' : 'grayscale(100%)',
            opacity: i < current ? 1 : 0.4,
          }}
        >
          {i < current ? '❤️' : '🖤'}
        </span>
      ))}
    </div>
  )
}
