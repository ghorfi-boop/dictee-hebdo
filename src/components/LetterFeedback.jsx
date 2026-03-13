/**
 * LetterFeedback — affichage Wordle-style de la réponse de l'enfant
 * 🟢 Verte  = bonne lettre, bonne position
 * 🟡 Jaune  = lettre présente mais mal placée
 * ⬜ Grise  = lettre absente du mot
 */
export default function LetterFeedback({ answer, word }) {
  if (!answer || !word) return null

  const w = word.toLowerCase()
  const a = answer.toLowerCase().trim()

  // Build color map
  const result = Array(a.length).fill('absent')
  const wordLetterCount = {}

  // Count letters in word
  for (const c of w) {
    wordLetterCount[c] = (wordLetterCount[c] || 0) + 1
  }

  // First pass: mark correct positions (green)
  const remaining = { ...wordLetterCount }
  for (let i = 0; i < a.length; i++) {
    if (a[i] === w[i]) {
      result[i] = 'correct'
      remaining[a[i]] = (remaining[a[i]] || 0) - 1
    }
  }

  // Second pass: mark present letters (yellow)
  for (let i = 0; i < a.length; i++) {
    if (result[i] === 'correct') continue
    if (w.includes(a[i]) && (remaining[a[i]] || 0) > 0) {
      result[i] = 'present'
      remaining[a[i]]--
    }
  }

  const colors = {
    correct: { bg: '#22C55E', text: '#fff', label: '✓' },
    present: { bg: '#F59E0B', text: '#fff', label: '~' },
    absent:  { bg: '#94A3B8', text: '#fff', label: '✗' },
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'center',
      marginTop: 14,
      marginBottom: 4,
    }}>
      {a.split('').map((letter, i) => {
        const state = result[i]
        const { bg, text } = colors[state]
        return (
          <div
            key={i}
            className="animate-pop"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: bg,
              color: text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 900,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              animationDelay: `${i * 60}ms`,
            }}
          >
            {letter}
          </div>
        )
      })}
    </div>
  )
}
