// ** React Imports
import { Navigate, useLocation } from 'react-router-dom'
import { useContext, Suspense } from 'react'

// ** Context Imports
import { AbilityContext } from '@src/utility/context/Can'

// ** Spinner Import
import Spinner from '../spinner/Loading-spinner'

// ** Utils
import { getUserData } from '@src/utils'

const PrivateRoute = ({ children, route }) => {
  // ** Hooks & Vars
  const ability = useContext(AbilityContext)
  const userData = getUserData()
  const location = useLocation()

  // DEBUG: Log userData and route meta for troubleshooting
  console.log('DEBUG PrivateRoute:', { 
    userData, 
    routeMeta: route?.meta, 
    currentPath: location.pathname,
    hasChildren: !!children,
    childrenType: children?.type?.name || children?.type || typeof children
  })

  if (!userData) {
    console.log('PrivateRoute - Redirecting to login: No user data')
    return <Navigate to='/login' />
  }

  if (route) {
    let action = null
    let resource = null
    let restrictedRoute = false
    let roles = []

    if (route.meta) {
      action = route.meta.action
      resource = route.meta.resource
      restrictedRoute = route.meta.restricted
      roles = route.meta.roles || []
    }

    // Log detailed route information
    console.log('PrivateRoute - Route Details:', {
      userData,
      routePath: route?.path,
      currentPath: location.pathname,
      meta: route?.meta,
      roles,
      userRole: userData.role
    })

    // If restricted route and user is logged in, redirect to home
    if (restrictedRoute) {
      console.log('PrivateRoute - Redirecting to home: Restricted route')
      return <Navigate to='/' />
    }

    // If route requires specific roles
    if (roles.length > 0) {
      console.log('PrivateRoute - Checking roles:', { required: roles, current: userData.role })
      // If user doesn't have required role
      if (!roles.includes(userData.role)) {
        console.log('PrivateRoute - Role not authorized')
        // Redirect to appropriate page based on role
        if (userData.role === 'admin') {
          return <Navigate to='/admin-dashboard' />
        } else if (userData.role === 'enseignant') {
          return <Navigate to='/teacher-dashboard' />
        } else {
          return <Navigate to='/error' />
        }
      }
    }

    // Check specific permissions (if configured)
    if (action && resource) {
      console.log('PrivateRoute - Checking permissions:', { action, resource })
      if (!ability.can(action, resource)) {
        return <Navigate to='/misc/not-authorized' replace />
      }
    }
  }

  console.log('PrivateRoute - Rendering children:', { 
    path: location.pathname, 
    childrenType: children?.type?.name || children?.type || typeof children 
  })

  return (
    <Suspense fallback={<Spinner className='content-loader' />}>
      {children}
    </Suspense>
  )
}

export default PrivateRoute
