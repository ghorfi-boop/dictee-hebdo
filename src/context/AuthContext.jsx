import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { getCurrentUser, getChildren } from '../services/db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [parent, setParent] = useState(null)         // Supabase auth user + profile
  const [activeChild, setActiveChild] = useState(null) // Child profile (local session)
  const [isLoading, setIsLoading] = useState(true)

  // Restore child session from sessionStorage on mount
  useEffect(() => {
    const storedChild = sessionStorage.getItem('dictee_active_child')
    if (storedChild) {
      try {
        setActiveChild(JSON.parse(storedChild))
      } catch {
        sessionStorage.removeItem('dictee_active_child')
      }
    }
  }, [])

  // Listen to Supabase auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadParentProfile(session.user)
      }
      setIsLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadParentProfile(session.user)
        } else {
          setParent(null)
          setActiveChild(null)
          sessionStorage.removeItem('dictee_active_child')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadParentProfile(user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setParent({ user, profile })
    } catch {
      setParent({ user, profile: null })
    }
  }

  async function loginChild(childData) {
    setActiveChild(childData)
    sessionStorage.setItem('dictee_active_child', JSON.stringify(childData))
  }

  function logoutChild() {
    setActiveChild(null)
    sessionStorage.removeItem('dictee_active_child')
  }

  async function logoutParent() {
    setActiveChild(null)
    sessionStorage.removeItem('dictee_active_child')
    await supabase.auth.signOut()
    setParent(null)
  }

  async function refreshActiveChild() {
    if (!activeChild || !parent?.profile?.id) return
    try {
      const { data: updated } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeChild.id)
        .single()
      
      if (updated) {
        setActiveChild(updated)
        sessionStorage.setItem('dictee_active_child', JSON.stringify(updated))
      }
    } catch {}
  }

  // Compatibility helpers
  const isParentLoggedIn = !!parent?.user
  const isChildLoggedIn = !!activeChild

  return (
    <AuthContext.Provider
      value={{
        parent: parent?.profile || parent?.user,   // backward compat
        parentUser: parent?.user,
        parentProfile: parent?.profile,
        activeChild,
        isLoading,
        isParentLoggedIn,
        isChildLoggedIn,
        loginChild,
        logoutChild,
        logoutParent,
        refreshActiveChild,
        // Legacy compat
        loginParent: () => {}, // no-op, handled by Supabase
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
