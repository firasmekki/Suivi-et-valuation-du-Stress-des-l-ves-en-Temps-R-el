// ** React Imports
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Third Party Components
import { Power } from 'react-feather'

// ** Reactstrap Imports
import { UncontrolledDropdown, DropdownMenu, DropdownToggle, DropdownItem } from 'reactstrap'

// ** Default Avatar Image
import defaultAvatar from '@src/assets/images/portrait/small/avatar-s-11.jpg'

const UserDropdown = () => {
  const [userName, setUserName] = useState('Admin')
  const [userRole, setUserRole] = useState('admin')

  useEffect(() => {
    const fetchUserData = () => {
      const storedName = localStorage.getItem('userName')
      const storedRole = localStorage.getItem('userRole')
      
      if (storedName && storedName !== 'undefined') {
        setUserName(storedName)
      }
      if (storedRole) {
        setUserRole(storedRole)
      }
    }

    fetchUserData()

    // Listen for storage changes to update the component
    window.addEventListener('storage', fetchUserData)

    return () => {
      window.removeEventListener('storage', fetchUserData)
    }
  }, [])


  // Handle Logout
  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <UncontrolledDropdown tag='li' className='dropdown-user nav-item'>
      <DropdownToggle href='/' tag='a' className='nav-link dropdown-user-link' onClick={e => e.preventDefault()}>
        <div className='user-nav d-sm-flex d-none'>
          <span className='user-name fw-bold'>{userName}</span>
          <span className='user-status'>{userRole}</span>
        </div>
        <Avatar img={defaultAvatar} imgHeight='40' imgWidth='40' status='online' />
      </DropdownToggle>
      <DropdownMenu end>
        <DropdownItem tag={Link} to='/login' onClick={handleLogout}>
          <Power size={14} className='me-75' />
          <span className='align-middle'>Déconnexion</span>
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  )
}

export default UserDropdown
