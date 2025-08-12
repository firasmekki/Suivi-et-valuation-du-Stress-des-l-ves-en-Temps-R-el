import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

// Configuration de l'URL de base pour l'API
axios.defaults.baseURL = 'http://localhost:5000'

// Types d'actions
export const GET_NOTES_BY_CLASSE = 'GET_NOTES_BY_CLASSE'
export const GET_NOTES_BY_ETUDIANT = 'GET_NOTES_BY_ETUDIANT'
export const CREATE_OR_UPDATE_NOTE = 'CREATE_OR_UPDATE_NOTE'
export const DELETE_NOTE = 'DELETE_NOTE'
export const SET_LOADING = 'SET_LOADING'
export const CLEAR_NOTES = 'CLEAR_NOTES'

// Actions asynchrones
export const getNotesByClasse = createAsyncThunk(
  'notes/getByClasse',
  async (classeId, { rejectWithValue }) => {
    try {
      console.log('=== DÉBUT RÉCUPÉRATION NOTES FRONTEND ===');
      console.log('ID Classe demandé:', classeId);
      
      // Récupérer le token
      const token = localStorage.getItem('token')
      
      const response = await axios.get(
        `/api/notes/classe/${classeId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Réponse brute du serveur:', response);
      console.log('Données des notes reçues:', response.data);
      
      console.log('=== FIN RÉCUPÉRATION NOTES FRONTEND ===');
      return response.data;
    } catch (error) {
      console.error('=== ERREUR RÉCUPÉRATION NOTES FRONTEND ===');
      console.error('Erreur détaillée:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      console.error('=== FIN ERREUR ===');
      return rejectWithValue(error.response.data);
    }
  }
)

export const getNotesByEtudiant = createAsyncThunk(
  'note/getNotesByEtudiant',
  async (etudiantId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/notes/etudiant/${etudiantId}`)
      return res.data.data
    } catch (error) {
      toast.error('Erreur lors de la récupération des notes')
      return rejectWithValue(error.response.data)
    }
  }
)

export const createOrUpdateNote = createAsyncThunk(
  'notes/createOrUpdateNote',
  async ({ classeId, etudiantId, noteData }, { rejectWithValue }) => {
    console.log('=== [DEBUG] createOrUpdateNote CALLED ===')
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token non trouvé dans le localStorage')
        return rejectWithValue('Token non trouvé')
      }

      // Log des données reçues
      console.log('Données reçues dans createOrUpdateNote:', {
        classeId,
        etudiantId,
        noteData
      })

      // Préparer les données de la note selon le modèle attendu
      const notePayload = {
        classe: classeId,
        etudiant: etudiantId,
        matiere: noteData.matiere || 'math',
        enseignant: localStorage.getItem('userId')
      }

      // Ajouter la note selon son type (controle ou examen)
      if (noteData.type === 'controle') {
        notePayload.controle = {
          note: noteData.note,
          appreciation: ''
        }
      } else if (noteData.type === 'examen') {
        notePayload.examen = {
          note: noteData.note,
          appreciation: ''
        }
      }

      console.log('Envoi des données de note au serveur:', notePayload)

      const response = await axios.post(
        `/api/notes`,
        notePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('Réponse brute du serveur:', response)

      if (!response.data) {
        throw new Error('Aucune donnée reçue de l\'API')
      }

      console.log('Données de la réponse:', response.data)
      return response.data
    } catch (error) {
      console.error('Erreur détaillée:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data,
        requestData: error.config?.data
      })
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création/mise à jour de la note')
    }
  }
)

export const deleteNote = createAsyncThunk(
  'note/deleteNote',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/notes/${id}`)
      toast.success('Note supprimée avec succès')
      return id
    } catch (error) {
      toast.error('Erreur lors de la suppression de la note')
      return rejectWithValue(error.response.data)
    }
  }
)

export const createNote = createAsyncThunk(
  'notes/create',
  async (noteData, { rejectWithValue }) => {
    try {
      console.log('=== DÉBUT CRÉATION NOTE FRONTEND ===');
      console.log('Données de la note à créer:', noteData);
      
      const response = await axios.post('/api/notes', noteData);
      console.log('Réponse du serveur:', response.data);
      
      console.log('=== FIN CRÉATION NOTE FRONTEND ===');
      return response.data;
    } catch (error) {
      console.error('=== ERREUR CRÉATION NOTE FRONTEND ===');
      console.error('Erreur détaillée:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      console.error('=== FIN ERREUR ===');
      return rejectWithValue(error.response.data);
    }
  }
);

// Slice
const noteSlice = createSlice({
  name: 'note',
  initialState: {
    notes: [],
    loading: false,
    error: null
  },
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
      // getNotesByClasse
      .addCase(getNotesByClasse.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getNotesByClasse.fulfilled, (state, action) => {
        state.loading = false
        state.notes = Array.isArray(action.payload?.data) 
          ? action.payload.data 
          : Array.isArray(action.payload) 
            ? action.payload 
            : []
        state.error = null
      })
      .addCase(getNotesByClasse.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Une erreur est survenue'
        state.notes = []
      })
      // getNotesByEtudiant
      .addCase(getNotesByEtudiant.pending, (state) => {
        state.loading = true
      })
      .addCase(getNotesByEtudiant.fulfilled, (state, action) => {
        state.loading = false
        state.notes = action.payload
      })
      .addCase(getNotesByEtudiant.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // createOrUpdateNote
      .addCase(createOrUpdateNote.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrUpdateNote.fulfilled, (state, action) => {
        state.loading = false
        console.log('Note créée/mise à jour:', action.payload)
        const updatedNote = action.payload.data || action.payload
        const index = state.notes.findIndex(note => note._id === updatedNote._id)
        if (index !== -1) {
          state.notes[index] = updatedNote
        } else {
          state.notes.push(updatedNote)
        }
      })
      .addCase(createOrUpdateNote.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Une erreur est survenue'
      })
      // deleteNote
      .addCase(deleteNote.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.loading = false
        state.notes = state.notes.filter(note => note._id !== action.payload)
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError, clearNotes } = noteSlice.actions
export default noteSlice.reducer 