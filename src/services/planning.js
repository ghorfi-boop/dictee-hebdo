/**
 * Generate a weekly planning from a list of words.
 * Words are distributed evenly across Mon-Fri.
 * Weekend = all words (revision).
 */
export function generatePlanning(words) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const planning = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    weekend_review: [...(words || [])],
  }

  if (!words || words.length === 0) return planning

  // Distribute evenly
  words.forEach((word, idx) => {
    const dayIndex = idx % 5
    planning[days[dayIndex]].push(word)
  })

  return planning
}

export function getDayLabel(key) {
  const labels = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    weekend: 'Week-end',
    weekend_review: 'Week-end',
  }
  return labels[key] || key
}

export function getDayEmoji(key) {
  const emojis = {
    monday: '🌙',
    tuesday: '🔥',
    wednesday: '⚡',
    thursday: '🌟',
    friday: '🎉',
    weekend: '🏆',
    weekend_review: '🏆',
  }
  return emojis[key] || '📚'
}

export function getOrderedDays() {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'weekend_review']
}

export function isWeekend() {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

export function isDayCompleted(scores, wordListId, childId, day) {
  return scores.some(
    (s) => s.wordListId === wordListId && s.childId === childId && s.day === day
  )
}
