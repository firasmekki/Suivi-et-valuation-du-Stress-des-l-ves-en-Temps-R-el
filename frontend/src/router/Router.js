// ** Router imports
import { useRoutes, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'

// ** GetRoutes
import { getRoutes } from './routes/index.js'

// ** Hooks Imports
import { useLayout } from '@hooks/useLayout'

const Router = () => {
  // ** Hooks
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // ** Layout
  const layout = useMemo(() => {
    const publicPaths = ['/login', '/register', '/forgot-password']
    return publicPaths.includes(location.pathname) ? 'blank' : 'vertical'
  }, [location.pathname])

  // ** Check if current route is public
  const isPublicRoute = useMemo(() => {
    const publicPaths = ['/login', '/register', '/forgot-password', '/error']
    return publicPaths.some(path => location.pathname === path)
  }, [location.pathname])

  // Fonction pour vérifier l'authentification
  const checkAuth = () => {
    try {
      const token = localStorage.getItem('token')
      const role = localStorage.getItem('userRole')
      const userId = localStorage.getItem('userId')
      
      const authenticated = !!(token && role && userId)
      setIsAuthenticated(authenticated)
      setUserRole(role)
      setIsLoading(false)

      console.log('Auth State:', { 
        token: !!token, 
        role, 
        userId,
        authenticated,
        path: location.pathname,
        isPublicRoute: isPublicRoute
      })
    } catch (err) {
      console.error('Error checking auth:', err)
      setError('Error checking authentication')
      setIsLoading(false)
    }
  }

  // ** Effect to check authentication
  useEffect(() => {
    checkAuth()
  }, [location.pathname, isPublicRoute])

  // ** Effect to listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // ** Use routes hook (TOUJOURS appelé pour respecter l'ordre des hooks)
  const allRoutes = useRoutes(getRoutes(layout, isAuthenticated))

  // ** Loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // ** Error state
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-danger">Error loading the application. Please try again.</div>
      </div>
    )
  }

  // ** Authentication redirects
  if (!isAuthenticated && !isPublicRoute) {
    console.log('Redirecting to login: Not authenticated')
    return <Navigate to="/login" replace />
  }

  // ** If authenticated and trying to access root, redirect to dashboard selon le rôle
  if (isAuthenticated && location.pathname === '/') {
    if (userRole === 'admin') {
      console.log('Redirecting to admin dashboard')
      return <Navigate to="/admin-dashboard" replace />
    } else if (userRole === 'enseignant') {
      console.log('Redirecting to teacher dashboard')
      return <Navigate to="/teacher-dashboard" replace />
    } else {
      console.log('Redirecting to home page')
      return <Navigate to="/home" replace />
    }
  }

  // ** No routes matched
  if (!allRoutes && !isLoading) {
    console.log('No route matched, redirecting to error page')
    return <Navigate to="/error" replace />
  }

  // ** Return matched routes
  return allRoutes
}

export default Router
