import { createContext, useContext, useState, useEffect } from 'react'
import { getParent, getChildren } from '../services/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [parent, setParent] = useState(null)
  const [activeChild, setActiveChild] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage flags
    const p = getParent()
    const sessionParent = sessionStorage.getItem('dictee_parent_logged')
    const sessionChild = sessionStorage.getItem('dictee_active_child')

    if (p && sessionParent === 'true') {
      setParent(p)
    }
    if (sessionChild) {
      try {
        const childData = JSON.parse(sessionChild)
        setActiveChild(childData)
      } catch {
        sessionStorage.removeItem('dictee_active_child')
      }
    }
    setIsLoading(false)
  }, [])

  function loginParent(parentData) {
    setParent(parentData)
    sessionStorage.setItem('dictee_parent_logged', 'true')
  }

  function logoutParent() {
    setParent(null)
    setActiveChild(null)
    sessionStorage.removeItem('dictee_parent_logged')
    sessionStorage.removeItem('dictee_active_child')
  }

  function loginChild(childData) {
    setActiveChild(childData)
    sessionStorage.setItem('dictee_active_child', JSON.stringify(childData))
  }

  function logoutChild() {
    setActiveChild(null)
    sessionStorage.removeItem('dictee_active_child')
  }

  // Refresh active child data if updated
  function refreshActiveChild() {
    if (!activeChild) return
    const allChildren = getChildren()
    const updated = allChildren.find((c) => c.id === activeChild.id)
    if (updated) {
      setActiveChild(updated)
      sessionStorage.setItem('dictee_active_child', JSON.stringify(updated))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        parent,
        activeChild,
        isLoading,
        isParentLoggedIn: !!parent,
        isChildLoggedIn: !!activeChild,
        loginParent,
        logoutParent,
        loginChild,
        logoutChild,
        refreshActiveChild,
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
