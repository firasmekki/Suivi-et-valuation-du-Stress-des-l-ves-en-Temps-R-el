import { createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

// Récupérer les classes
export const getClasses = createAsyncThunk(
  'classe/getClasses',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const userRole = localStorage.getItem('userRole')
      const userId = localStorage.getItem('userId')

      if (!token) {
        return rejectWithValue('Token non trouvé')
      }

      let url
      if (userRole === 'admin') {
        console.log('Récupération de toutes les classes (admin)')
        url = 'http://localhost:5000/api/classes'
      } else {
        console.log('Récupération des classes pour l\'enseignant:', userId)
        url = `http://localhost:5000/api/enseignants/${userId}/classes`
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      console.log('Réponse de l\'API:', response.data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la récupération des classes')
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des classes')
    }
  }
)

// Récupérer les étudiants d'une classe
export const getClassStudents = createAsyncThunk(
  'classe/getClassStudents',
  async (classeId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return rejectWithValue('Token manquant')
      }

      const response = await axios.get(`http://localhost:5000/api/classes/${classeId}/students`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la récupération des étudiants')
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des étudiants')
    }
  }
)