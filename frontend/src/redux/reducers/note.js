import { createSlice } from '@reduxjs/toolkit'
import { getNotesByClasse, createOrUpdateNote } from '../actions/note'

const initialState = {
  notes: [],
  loading: false,
  error: null
}

const noteSlice = createSlice({
  name: 'note',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearNotes: (state) => {
      state.notes = []
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Gestion de la récupération des notes
      .addCase(getNotesByClasse.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getNotesByClasse.fulfilled, (state, action) => {
        state.loading = false
        // La réponse de l'API contient les notes dans data
        state.notes = action.payload.data || action.payload || []
        state.error = null
      })
      .addCase(getNotesByClasse.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur lors de la récupération des notes'
      })
      // Gestion de la création/mise à jour des notes
      .addCase(createOrUpdateNote.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrUpdateNote.fulfilled, (state, action) => {
        state.loading = false
        // Mettre à jour la note dans le tableau
        const updatedNote = action.payload.data || action.payload
        const index = state.notes.findIndex(note => note._id === updatedNote._id)
        if (index !== -1) {
          state.notes[index] = updatedNote
        } else {
          state.notes.push(updatedNote)
        }
        state.error = null
      })
      .addCase(createOrUpdateNote.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur lors de la mise à jour de la note'
      })
  }
})

export const { clearError, clearNotes } = noteSlice.actions
export default noteSlice.reducer 