// ── Keys ──────────────────────────────────────────────────────────────────────
const KEYS = {
  PARENT: 'dictee_parent',
  CHILDREN: 'dictee_children',
  WORD_LISTS: 'dictee_word_lists',
  SCORES: 'dictee_scores',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function generateId() {
  return crypto.randomUUID()
}

export function hashPin(pin) {
  const salt = 'dictee_salt_2024'
  return btoa(salt + pin + salt)
}

export function hashPassword(password) {
  const salt = 'dictee_pw_salt_2024'
  return btoa(salt + password + salt + password.length)
}

export function getThisWeekStart() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = (day === 0 ? -6 : 1 - day) // How many days back to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export function getCurrentDayKey() {
  const day = new Date().getDay()
  const map = {
    0: 'weekend',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'weekend',
  }
  return map[day] || 'monday'
}

export function formatWeekStart(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Parent ────────────────────────────────────────────────────────────────────
export function getParent() {
  return getJSON(KEYS.PARENT)
}

export function saveParent(parent) {
  setJSON(KEYS.PARENT, parent)
}

export function createParent({ email, password }) {
  const parent = {
    id: generateId(),
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  saveParent(parent)
  return parent
}

export function checkParentPassword(password) {
  const parent = getParent()
  if (!parent) return false
  return parent.passwordHash === hashPassword(password)
}

// ── Children ──────────────────────────────────────────────────────────────────
export function getChildren() {
  return getJSON(KEYS.CHILDREN) || []
}

export function saveChildren(children) {
  setJSON(KEYS.CHILDREN, children)
}

export function createChild({ name, avatar, pin }) {
  const parent = getParent()
  const child = {
    id: generateId(),
    parentId: parent?.id,
    name,
    avatar,
    pinHash: hashPin(pin),
    createdAt: new Date().toISOString(),
  }
  const children = getChildren()
  children.push(child)
  saveChildren(children)
  return child
}

export function updateChild(id, updates) {
  const children = getChildren()
  const idx = children.findIndex((c) => c.id === id)
  if (idx === -1) return null
  children[idx] = { ...children[idx], ...updates }
  saveChildren(children)
  return children[idx]
}

export function deleteChild(id) {
  const children = getChildren().filter((c) => c.id !== id)
  saveChildren(children)
  // Also delete related data
  const wordLists = getWordLists().filter((w) => w.childId !== id)
  setJSON(KEYS.WORD_LISTS, wordLists)
  const scores = getScores().filter((s) => s.childId !== id)
  setJSON(KEYS.SCORES, scores)
}

export function checkChildPin(childId, pin) {
  const child = getChildren().find((c) => c.id === childId)
  if (!child) return false
  return child.pinHash === hashPin(pin)
}

// ── Word Lists ─────────────────────────────────────────────────────────────────
export function getWordLists() {
  return getJSON(KEYS.WORD_LISTS) || []
}

export function getWordListByChild(childId) {
  return getWordLists().filter((w) => w.childId === childId)
}

export function getCurrentWordList(childId) {
  const weekStart = getThisWeekStart()
  return getWordLists().find((w) => w.childId === childId && w.weekStart === weekStart)
}

export function saveWordList(wordList) {
  const lists = getWordLists()
  const idx = lists.findIndex((w) => w.id === wordList.id)
  if (idx === -1) {
    lists.push(wordList)
  } else {
    lists[idx] = wordList
  }
  setJSON(KEYS.WORD_LISTS, lists)
  return wordList
}

export function createWordList({ childId, words }) {
  const weekStart = getThisWeekStart()
  const existing = getCurrentWordList(childId)
  if (existing) {
    // Update existing
    const updated = { ...existing, words, planning: null, audioCached: false }
    return saveWordList(updated)
  }
  const wl = {
    id: generateId(),
    childId,
    weekStart,
    words,
    planning: null,
    audioCached: false,
    createdAt: new Date().toISOString(),
  }
  return saveWordList(wl)
}

export function updateWordListPlanning(id, planning) {
  const lists = getWordLists()
  const idx = lists.findIndex((w) => w.id === id)
  if (idx === -1) return null
  lists[idx].planning = planning
  setJSON(KEYS.WORD_LISTS, lists)
  return lists[idx]
}

export function markAudioCached(id) {
  const lists = getWordLists()
  const idx = lists.findIndex((w) => w.id === id)
  if (idx === -1) return
  lists[idx].audioCached = true
  setJSON(KEYS.WORD_LISTS, lists)
}

// ── Scores ────────────────────────────────────────────────────────────────────
export function getScores() {
  return getJSON(KEYS.SCORES) || []
}

export function getScoresByChild(childId) {
  return getScores().filter((s) => s.childId === childId)
}

export function getScoreByDay(childId, wordListId, day) {
  return getScores().find(
    (s) => s.childId === childId && s.wordListId === wordListId && s.day === day
  )
}

export function saveScore({ childId, wordListId, day, scorePct, stars, failedWords, attempts }) {
  const scores = getScores()
  // Replace if exists for same day
  const idx = scores.findIndex(
    (s) => s.childId === childId && s.wordListId === wordListId && s.day === day
  )
  const score = {
    id: idx >= 0 ? scores[idx].id : generateId(),
    childId,
    wordListId,
    day,
    scorePct,
    stars,
    failedWords: failedWords || [],
    attempts: attempts || 0,
    completedAt: new Date().toISOString(),
  }
  if (idx >= 0) {
    scores[idx] = score
  } else {
    scores.push(score)
  }
  setJSON(KEYS.SCORES, scores)
  return score
}

// ── Stats helpers ─────────────────────────────────────────────────────────────
export function getChildStats(childId) {
  const wordLists = getWordListByChild(childId)
  const scores = getScoresByChild(childId)
  const totalSessions = scores.length
  const avgScore =
    totalSessions > 0
      ? Math.round(scores.reduce((a, b) => a + b.scorePct, 0) / totalSessions)
      : 0
  return { totalSessions, avgScore, wordLists: wordLists.length }
}
