// ** React Imports
import { Outlet } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'

// ** Core Layout Import
// !Do not remove the Layout import
import Layout from '@src/@core/layouts/VerticalLayout'

// ** Menu Items Array
import getNavigation from '@src/navigation/vertical'

const VerticalLayout = props => {
  const [menuData, setMenuData] = useState([])

  const userRole = useMemo(() => localStorage.getItem('userRole'), [])
  const isAuthenticated = useMemo(() => !!localStorage.getItem('token'), [])

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping menu generation')
      setMenuData([])
      return
    }

    console.log('Current user role:', userRole)
    const navigation = getNavigation(userRole)
    console.log('Generated navigation:', navigation)
    setMenuData(navigation)
  }, [isAuthenticated, userRole])

  // Si non authentifié, ne pas rendre le layout
  if (!isAuthenticated) {
    return <Outlet />
  }

  return (
    <Layout menuData={menuData} {...props}>
      <Outlet />
    </Layout>
  )
}

export default VerticalLayout
