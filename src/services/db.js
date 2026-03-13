import { supabase } from './supabase'

// ── Utils ──────────────────────────────────────────────────────────────────────

export function getThisWeekStart() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day // How many days back to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export function getCurrentDayKey() {
  const day = new Date().getDay()
  const map = {
    0: 'weekend_review',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'weekend_review',
  }
  return map[day] || 'monday'
}

export function formatWeekStart(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function hashPin(pin) {
  return btoa(pin + 'dictee_salt_2024')
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split('@')[0] },
    },
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return { user, profile }
}

// ── Child profiles ─────────────────────────────────────────────────────────────

export async function createChildProfile(parentId, { name, avatar, pin }) {
  const pinHash = hashPin(pin)
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: crypto.randomUUID(),
      role: 'child',
      display_name: name,
      avatar: avatar || '🎓',
      parent_id: parentId,
      pin_hash: pinHash,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getChildren(parentId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('parent_id', parentId)
    .eq('role', 'child')
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function verifyChildPin(childId, pin) {
  const { data, error } = await supabase
    .from('profiles')
    .select('pin_hash')
    .eq('id', childId)
    .single()
  
  if (error || !data) return false
  return data.pin_hash === hashPin(pin)
}

export async function deleteChildProfile(childId) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', childId)
  
  if (error) throw error
}

// ── Word lists ─────────────────────────────────────────────────────────────────

export async function saveWordList(childId, parentId, weekStart, words, planning) {
  const { data, error } = await supabase
    .from('word_lists')
    .upsert(
      {
        child_id: childId,
        parent_id: parentId,
        week_start: weekStart,
        words,
        planning: planning || {},
        audio_cached: false,
      },
      { onConflict: 'child_id,week_start' }
    )
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateWordListPlanning(wordListId, planning) {
  const { data, error } = await supabase
    .from('word_lists')
    .update({ planning })
    .eq('id', wordListId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function markAudioCached(wordListId) {
  const { error } = await supabase
    .from('word_lists')
    .update({ audio_cached: true })
    .eq('id', wordListId)
  
  if (error) throw error
}

export async function getWordList(childId, weekStart) {
  const { data, error } = await supabase
    .from('word_lists')
    .select('*')
    .eq('child_id', childId)
    .eq('week_start', weekStart)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getCurrentWordList(childId) {
  const weekStart = getThisWeekStart()
  return getWordList(childId, weekStart)
}

export async function getWordListHistory(childId) {
  const { data, error } = await supabase
    .from('word_lists')
    .select('*')
    .eq('child_id', childId)
    .order('week_start', { ascending: false })
  
  if (error) throw error
  return data || []
}

// ── Scores ─────────────────────────────────────────────────────────────────────

export async function saveScore(childId, wordListId, day, { scorePct, stars, failedWords, attempts }) {
  const { data, error } = await supabase
    .from('scores')
    .upsert(
      {
        child_id: childId,
        word_list_id: wordListId,
        day,
        score_pct: scorePct,
        stars,
        failed_words: failedWords || [],
        attempts: attempts || 1,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'child_id,word_list_id,day' }
    )
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getScores(childId, wordListId) {
  const query = supabase
    .from('scores')
    .select('*')
    .eq('child_id', childId)
  
  if (wordListId) {
    query.eq('word_list_id', wordListId)
  }
  
  const { data, error } = await query.order('completed_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllScores(childId) {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('child_id', childId)
    .order('completed_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getChildStats(childId) {
  const scores = await getAllScores(childId)
  const wordLists = await getWordListHistory(childId)
  const totalSessions = scores.length
  const avgScore =
    totalSessions > 0
      ? Math.round(scores.reduce((a, b) => a + b.score_pct, 0) / totalSessions)
      : 0
  return { totalSessions, avgScore, wordLists: wordLists.length }
}
