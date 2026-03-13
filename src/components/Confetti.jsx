import { useEffect, useState } from 'react'

const COLORS = ['#6C63FF', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#3B82F6']
const PIECES = 80

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

export default function Confetti({ active = false }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }

    const generated = Array.from({ length: PIECES }).map((_, i) => ({
      id: i,
      x: randomBetween(0, 100),
      delay: randomBetween(0, 1.5),
      duration: randomBetween(1.5, 3),
      size: randomBetween(8, 16),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: randomBetween(0, 360),
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
    setPieces(generated)

    const timer = setTimeout(() => setPieces([]), 4000)
    return () => clearTimeout(timer)
  }, [active])

  if (!active && pieces.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes confetti-sway {
          0%, 100% { margin-left: 0; }
          25% { margin-left: 30px; }
          75% { margin-left: -30px; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: -20,
            width: p.shape === 'circle' ? p.size : p.size * 0.6,
            height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            background: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards, confetti-sway ${p.duration * 0.7}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}
