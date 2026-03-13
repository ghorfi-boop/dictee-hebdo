import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import ParentDashboard from './pages/ParentDashboard'
import WordCapture from './pages/WordCapture'
import WordVerify from './pages/WordVerify'
import Planning from './pages/Planning'
import ChildHome from './pages/ChildHome'
import Exercise from './pages/Exercise'
import Results from './pages/Results'
import History from './pages/History'

function ProtectedParent({ children }) {
  const { isParentLoggedIn, isLoading } = useAuth()
  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh' }}><div className="spinner" /></div>
  if (!isParentLoggedIn) return <Navigate to="/" replace />
  return children
}

function ProtectedChild({ children }) {
  const { isChildLoggedIn, isLoading } = useAuth()
  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh' }}><div className="spinner" /></div>
  if (!isChildLoggedIn) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { isParentLoggedIn, isChildLoggedIn, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          isChildLoggedIn
            ? <Navigate to="/child" replace />
            : isParentLoggedIn
              ? <Navigate to="/parent" replace />
              : <Login />
        }
      />

      {/* Parent routes */}
      <Route path="/parent" element={<ProtectedParent><ParentDashboard /></ProtectedParent>} />
      <Route path="/words" element={<ProtectedParent><WordCapture /></ProtectedParent>} />
      <Route path="/verify" element={<ProtectedParent><WordVerify /></ProtectedParent>} />
      <Route path="/planning" element={<ProtectedParent><Planning /></ProtectedParent>} />

      {/* Child routes */}
      <Route path="/child" element={<ProtectedChild><ChildHome /></ProtectedChild>} />
      <Route path="/exercise" element={<ProtectedChild><Exercise /></ProtectedChild>} />
      <Route path="/results" element={<ProtectedChild><Results /></ProtectedChild>} />
      <Route path="/history" element={<ProtectedChild><History /></ProtectedChild>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
