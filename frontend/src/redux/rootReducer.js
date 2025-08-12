// ** Reducers Imports
import layout from './layout'
import navbar from './navbar'
import auth from './reducers/auth'
import classe from './reducers/classe'
import note from './reducers/note'
import etudiant from './reducers/etudiant'

const rootReducer = { 
  navbar, 
  layout, 
  auth, 
  classe, 
  note, 
  etudiant 
}

export default rootReducer
