// ** Redux Imports
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './reducers/auth'
import layoutReducer from './reducers/layout'
import classeReducer from './reducers/classe'
import noteReducer from './reducers/note'
import etudiantReducer from './reducers/etudiant'
import navbarReducer from './navbar'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    layout: layoutReducer,
    classe: classeReducer,
    note: noteReducer,
    etudiant: etudiantReducer,
    navbar: navbarReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
