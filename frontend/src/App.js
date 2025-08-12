import React, { Suspense, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initAuth } from './redux/reducers/auth'

// ** Router Import
import Router from './router/Router'

const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
)

const App = () => {
  const dispatch = useDispatch()
  const authLoaded = useSelector(state => state.auth.authLoaded)

  useEffect(() => {
    // Initialize auth state from localStorage
    dispatch(initAuth())

    // Log initial auth state
    const token = localStorage.getItem('token')
    const userRole = localStorage.getItem('userRole')
    console.log('Token status:', token ? 'Present' : 'Not found')
    console.log('User role:', userRole)
    console.log('Components loaded:', { Router: !!Router })
  }, [dispatch])

  if (!authLoaded) {
    return <LoadingSpinner />
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router />
    </Suspense>
  )
}

export default App
