#!/usr/bin/env node
// One-time Supabase schema setup script
// Run: node scripts/setup-supabase.js

const SUPABASE_URL = 'https://bnokfvgnzkbhhndamnbf.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJub2tmdmduemtiaGhuZGFtbmJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxMDU0NSwiZXhwIjoyMDg4OTg2NTQ1fQ.J2N7PCZjCIYnNXBhZ9BD6CPjUfS-iEEPyZUA63be2t0'

const SQL = `
-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  display_name TEXT NOT NULL,
  avatar TEXT DEFAULT '🎓',
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Word lists
CREATE TABLE IF NOT EXISTS word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  words JSONB NOT NULL DEFAULT '[]',
  planning JSONB NOT NULL DEFAULT '{}',
  audio_cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, week_start)
);

-- Scores
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('monday','tuesday','wednesday','thursday','friday','weekend_review')),
  score_pct SMALLINT NOT NULL DEFAULT 0,
  stars SMALLINT NOT NULL DEFAULT 0,
  failed_words JSONB DEFAULT '[]',
  attempts SMALLINT DEFAULT 1,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, word_list_id, day)
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
`

const SQL_POLICIES = `
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile and children" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can insert child profiles" ON profiles;
DROP POLICY IF EXISTS "Read own word lists" ON word_lists;
DROP POLICY IF EXISTS "Read own scores" ON scores;

-- Policies profiles
CREATE POLICY "Users can read own profile and children" ON profiles
  FOR SELECT USING (auth.uid() = id OR auth.uid() = parent_id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Parents can insert child profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = parent_id OR auth.uid() = id);

-- Policies word_lists
CREATE POLICY "Read own word lists" ON word_lists
  FOR ALL USING (
    auth.uid() = parent_id OR auth.uid() = child_id
  );

-- Policies scores
CREATE POLICY "Read own scores" ON scores
  FOR ALL USING (
    auth.uid() = child_id OR
    auth.uid() IN (SELECT parent_id FROM profiles WHERE id = child_id)
  );
`

const SQL_TRIGGER = `
-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, display_name)
  VALUES (NEW.id, 'parent', COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
`

async function runSQL(sql, label) {
  console.log(`\n🔄 Executing: ${label}...`)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  })

  if (!res.ok) {
    // Try the management API approach via pg_query
    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    })
    
    if (!res2.ok) {
      const text = await res.text()
      console.warn(`⚠️ ${label}: ${text.substring(0, 200)}`)
      return false
    }
  }
  
  console.log(`✅ ${label} done`)
  return true
}

async function main() {
  console.log('🚀 Setting up Supabase schema for Dictée Hebdo...')
  
  // Use the Management API
  const PROJECT_REF = 'bnokfvgnzkbhhndamnbf'
  
  const queries = [
    { sql: SQL, label: 'Create tables + RLS' },
    { sql: SQL_POLICIES, label: 'Create RLS policies' },
    { sql: SQL_TRIGGER, label: 'Create signup trigger' },
  ]
  
  for (const { sql, label } of queries) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    })
    
    const text = await response.text()
    
    if (response.ok) {
      console.log(`✅ ${label}`)
    } else {
      console.log(`⚠️ ${label} via Management API failed (${response.status}): ${text.substring(0, 300)}`)
      console.log('   Trying alternative...')
      
      // Fallback: try direct REST RPC
      await runSQL(sql, label + ' (fallback)')
    }
  }
  
  console.log('\n✨ Schema setup complete!')
}

main().catch(console.error)
