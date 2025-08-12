import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
  authLoaded: false
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initAuth: (state) => {
      const token = localStorage.getItem('token')
      const userRole = localStorage.getItem('userRole')
      const userMatiere = localStorage.getItem('userMatiere')
      const userName = localStorage.getItem('userName')
      
      if (token && userRole) {
        state.token = token
        state.isAuthenticated = true
        state.user = {
          role: userRole,
          matiere: userMatiere,
          name: userName
        }
      }
      state.authLoaded = true
    },
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      
      // Save all user data to localStorage
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('userRole', action.payload.user.role)
      localStorage.setItem('userId', action.payload.user.id || action.payload.user._id)
      localStorage.setItem('userName', action.payload.user.name || action.payload.user.username)
      if (action.payload.user.matiere) {
        localStorage.setItem('userMatiere', action.payload.user.matiere)
      }
      
      state.authLoaded = true
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
      state.authLoaded = true
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      
      // Clear all user data from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      localStorage.removeItem('userMatiere')
      
      state.authLoaded = true
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const { initAuth, loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions
export default authSlice.reducer 