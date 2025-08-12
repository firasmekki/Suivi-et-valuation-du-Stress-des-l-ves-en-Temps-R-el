import { createSlice } from '@reduxjs/toolkit'
import { getClasses, getClassStudents } from '../actions/classe'

const initialState = {
  classes: [],
  selectedClass: null,
  students: [],
  loading: false,
  error: null
}

const classeSlice = createSlice({
  name: 'classe',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearClasses: (state) => {
      state.classes = []
      state.selectedClass = null
      state.students = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Gestion des classes
      .addCase(getClasses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getClasses.fulfilled, (state, action) => {
        state.loading = false
        // Vérifier si la réponse contient des données
        if (action.payload && action.payload.data) {
          state.classes = action.payload.data
        } else if (Array.isArray(action.payload)) {
          state.classes = action.payload
        } else {
          state.classes = []
        }
        state.error = null
      })
      .addCase(getClasses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur lors de la récupération des classes'
      })
      // Gestion des étudiants d'une classe
      .addCase(getClassStudents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getClassStudents.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload && action.payload.data) {
          state.students = action.payload.data
        } else if (Array.isArray(action.payload)) {
          state.students = action.payload
        } else {
          state.students = []
        }
        state.error = null
      })
      .addCase(getClassStudents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur lors de la récupération des étudiants'
      })
  }
})

export const { clearError, clearClasses } = classeSlice.actions
export default classeSlice.reducer 