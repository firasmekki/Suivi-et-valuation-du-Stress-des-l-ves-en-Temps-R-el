// ** Checks if an object is empty (returns boolean)
export const isObjEmpty = obj => Object.keys(obj).length === 0

// ** Returns K format from a number
export const kFormatter = num => (num > 999 ? `${(num / 1000).toFixed(1)}k` : num)

// ** Converts HTML to string
export const htmlToString = html => html.replace(/<\/?[^>]+(>|$)/g, '')

// ** Returns user data from localStorage
export const getUserData = () => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName')

  if (token && userRole && userId) {
    return {
      token,
      role: userRole,
      id: userId,
      name: userName
    }
  }
  return null
}

// ** Get home route for logged in user based on their role
export const getHomeRouteForLoggedInUser = role => {
  if (role === 'admin') return '/admin-dashboard'
  if (role === 'enseignant') return '/teacher-dashboard'
  if (role === 'parent') return '/parent-dashboard'
  return '/login'
} 