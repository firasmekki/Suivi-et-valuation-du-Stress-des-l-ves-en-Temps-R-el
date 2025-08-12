import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  etudiants: [],
  loading: false,
  error: null
}

const etudiantSlice = createSlice({
  name: 'etudiant',
  initialState,
  reducers: {
    setLoading: (state) => {
      state.loading = true
      state.error = null
    },
    setEtudiants: (state, action) => {
      state.loading = false
      state.etudiants = action.payload
    },
    setError: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const { setLoading, setEtudiants, setError, clearError } = etudiantSlice.actions
export default etudiantSlice.reducer 