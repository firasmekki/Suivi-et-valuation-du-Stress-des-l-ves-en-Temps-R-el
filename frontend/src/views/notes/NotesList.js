import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Button, Table, Form, FormGroup, Label, Input, Modal, ModalHeader, ModalBody, Alert } from 'reactstrap'
import { getClasses } from '../../redux/actions/classe'
import { getNotesByClasse, createOrUpdateNote } from '../../redux/actions/note'
import { toast } from 'react-toastify'
import CustomAlert from '../../components/CustomAlert'
import CustomModal from '../../components/CustomModal'
import api from '../../configs/api'

const NotesList = () => {
  console.log('=== NOTESLIST COMPONENT RENDERING ===')
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  // Test Redux - récupérer tout l'état pour debug
  const fullState = useSelector((state) => state)
  
  const { classes, loading: classesLoading, error: classesError } = useSelector((state) => state.classe)
  const { notes: reduxNotes, loading: notesLoading, error: notesError } = useSelector((state) => state.note)
  const { user } = useSelector((state) => state.auth)
  const [selectedClasse, setSelectedClasse] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [noteType, setNoteType] = useState('controle')
  const [noteValue, setNoteValue] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [backendNoteError, setBackendNoteError] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  // Get user data from localStorage if not in Redux
  const userMatiere = user?.matiere || localStorage.getItem('userMatiere')
  const userRole = localStorage.getItem('userRole')
  const token = localStorage.getItem('token')

  // Vérifier l'authentification au chargement
  useEffect(() => {
    if (!token || !userRole) {
      toast.error('Veuillez vous connecter pour accéder à cette page')
      navigate('/login')
      return
    }

    // Vérifier si l'utilisateur a les droits d'accès
    if (!['admin', 'enseignant'].includes(userRole)) {
      toast.error('Vous n\'avez pas les droits d\'accès à cette page')
      navigate('/')
      return
    }

    // Charger les classes
    dispatch(getClasses())
  }, [dispatch, navigate, token, userRole])

  // Si user n'est pas encore chargé ou ne possède pas de champ matiere, afficher un loader
  if (!userMatiere && userRole === 'enseignant') {
    console.log('Enseignant without matiere, showing loader')
    return (
      <div className="text-center p-3">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement utilisateur...</span>
        </div>
        <p>Chargement des informations utilisateur...</p>
      </div>
    )
  }

  // Si l'utilisateur est admin, utiliser une matière par défaut ou permettre la sélection
  const currentMatiere = 'math'

  // Mapper les matières aux noms en français
  const matiereNames = {
    'math': 'Mathématiques',
    'physique': 'Physique',
    'chimie': 'Chimie',
    'francais': 'Français',
    'anglais': 'Anglais'
  }

  // Charger les notes quand la classe change
  useEffect(() => {
    if (selectedClasse?._id) {
      console.log('=== CHARGEMENT NOTES ===')
      console.log('ID Classe sélectionnée:', selectedClasse._id)
      console.log('Classe complète:', selectedClasse)
      dispatch(getNotesByClasse(selectedClasse._id))
    } else if (selectedClasse?.id) {
      console.log('=== CHARGEMENT NOTES (avec id) ===')
      console.log('ID Classe sélectionnée:', selectedClasse.id)
      console.log('Classe complète:', selectedClasse)
      dispatch(getNotesByClasse(selectedClasse.id))
    }
  }, [selectedClasse?._id, selectedClasse?.id, dispatch])

  // Sélectionner automatiquement la première classe disponible
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClasse) {
      console.log('Classes disponibles:', classes)
      console.log('Première classe:', classes[0])
      console.log('Structure de la première classe:', JSON.stringify(classes[0], null, 2))
      console.log('Sélection automatique de la première classe:', classes[0])
      setSelectedClasse(classes[0])
    }
  }, [classes])

  // Add debug log for notes
  useEffect(() => {
    console.log('=== NOTES REÇUES ===')
    console.log('Notes reçues du backend:', reduxNotes)
    console.log('Nombre de notes:', reduxNotes?.length || 0)
    if (reduxNotes && reduxNotes.length > 0) {
      console.log('Première note:', reduxNotes[0])
      console.log('Structure de la première note:', JSON.stringify(reduxNotes[0], null, 2))
    }
  }, [reduxNotes])

  // Debug log pour selectedClasse
  useEffect(() => {
    console.log('=== ÉTAT SELECTED CLASSE ===')
    console.log('selectedClasse:', selectedClasse)
    console.log('selectedClasse?._id:', selectedClasse?._id)
    console.log('selectedClasse?.niveau:', selectedClasse?.niveau)
    console.log('selectedClasse?.section:', selectedClasse?.section)
  }, [selectedClasse])

  // Vérifier si des notes ont un champ etudiant null
  useEffect(() => {
    if (reduxNotes && reduxNotes.length > 0) {
      const hasNullEtudiant = reduxNotes.some(n => !n.etudiant)
      setBackendNoteError(hasNullEtudiant)
    } else {
      setBackendNoteError(false)
    }
  }, [reduxNotes])

  const handleClasseChange = (event) => {
    const classeId = event.target.value
    
    if (!classeId) {
      setSelectedClasse(null)
      setSelectedStudent(null)
      return
    }
    
    const classe = classes.find(c => String(c._id || c.id) === String(classeId))
    
    if (classe) {
    setSelectedClasse(classe)
    setSelectedStudent(null)
    } else {
      setSelectedClasse(null)
    }
  }

  const handleAddNote = (student, type) => {
    setSelectedStudent(student)
    setNoteType(type)
    setIsModalOpen(true)
  }

  const handleSaveNote = async () => {
    alert('handleSaveNote called')
    console.log('handleSaveNote called')
    if (!selectedClasse || !selectedStudent || !noteValue) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    try {
      const classeId = selectedClasse._id || selectedClasse.id
      const actionPayload = {
        classeId,
        etudiantId: selectedStudent._id,
        noteData: {
          matiere: currentMatiere,
          type: noteType,
          note: parseFloat(noteValue)
        }
      }
      console.log('=== ENVOI REQUÊTE AJOUT NOTE (payload Redux) ===')
      console.log('payload envoyé:', actionPayload)
      const result = await dispatch(createOrUpdateNote(actionPayload)).unwrap()
      console.log('Réponse reçue après ajout note:', result)
      await dispatch(getNotesByClasse(classeId))
      setIsModalOpen(false)
      setNoteValue('')
      toast.success('Note ajoutée avec succès')
    } catch (error) {
      console.error('Erreur lors de la création de la note:', error)
      toast.error(error.message || 'Erreur lors de la création de la note')
      toast.error('Erreur lors de l\'envoi de la requête POST /api/notes. Vérifiez la console et l\'onglet Network.')
    }
  }

  // Générer les données pour le tableau
  const generateTableData = () => {
    if (!selectedClasse?.eleves) return [];
    // Créer un map des notes par étudiant (clé = String(_id))
    const notesByStudent = {};
    reduxNotes.forEach(note => {
      // Gestion robuste : accepte etudiant comme string ou objet
      const etuId = note.etudiant?._id || note.etudiant;
      if (etuId) {
        notesByStudent[String(etuId)] = note;
      }
    });
    return selectedClasse.eleves.map(eleve => {
      const note = notesByStudent[String(eleve._id)];
      return {
        id: eleve._id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        controle: note?.controle?.note ?? '-',
        examen: note?.examen?.note ?? '-'
      };
    });
  };

  const tableData = useMemo(() => {
    return generateTableData()
  }, [selectedClasse, reduxNotes, currentMatiere])

  // Afficher les erreurs si elles existent
  if (classesError) {
    return (
      <div className="p-3">
        <Alert color="danger">
          <h4 className="alert-heading">Erreur lors du chargement des classes</h4>
          <p>{classesError}</p>
          <Button color="primary" onClick={() => dispatch(getClasses())}>
            Réessayer
          </Button>
        </Alert>
      </div>
    )
  }

  if (notesError) {
    return (
      <div className="p-3">
        <Alert color="danger">
          <h4 className="alert-heading">Erreur lors du chargement des notes</h4>
          <p>{notesError}</p>
          {selectedClasse && (
            <Button color="primary" onClick={() => dispatch(getNotesByClasse(selectedClasse._id))}>
              Réessayer
            </Button>
          )}
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>
            {userRole === 'admin' && selectedClasse ? (
              <>Notes de {selectedClasse.niveau} {selectedClasse.section}</>
            ) : userRole === 'admin' ? (
              <>Gestion des Notes</>
            ) : (
              <>Notes de {matiereNames[currentMatiere] || currentMatiere}</>
            )}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {backendNoteError && (
            <Alert color="danger">
              Problème de données : certaines notes reçues du serveur n'ont pas de champ <b>etudiant</b>.<br />
              Merci de vérifier la configuration du backend (populate etudiant dans le controller).
            </Alert>
          )}
          <Row className="mb-2">
            <Col md="6">
              <FormGroup>
                <Label for="classe">Classe</Label>
                <Input
                  type="select"
                  name="classe"
                  id="classe"
                  value={selectedClasse?._id || selectedClasse?.id || ''}
                  onChange={handleClasseChange}
                  disabled={classesLoading}
                >
                  <option key="default" value="">Sélectionner une classe</option>
                  {classes?.map((classe, idx) => (
                    <option key={classe._id || classe.id || idx} value={classe._id || classe.id}>
                      {classe.niveau} {classe.section}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>

          {classesLoading ? (
            <div className="text-center p-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement des classes...</span>
              </div>
              <p>Chargement des classes...</p>
            </div>
          ) : notesLoading ? (
            <div className="text-center p-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement des notes...</span>
              </div>
              <p>Chargement des notes...</p>
            </div>
          ) : selectedClasse ? (
            <Table responsive>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Contrôle continu</th>
                  <th>Examen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      background: selectedStudentId === row.id ? '#e6f7ff' : 'inherit',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedStudentId(row.id)}
                  >
                    <td>{row.nom}</td>
                    <td>{row.prenom}</td>
                    <td>{row.controle}</td>
                    <td>{row.examen}</td>
                    <td>
                      <Button
                        color={row.controle === '-' ? 'success' : 'primary'}
                        size="sm"
                        className="me-1"
                        onClick={e => { e.stopPropagation(); handleAddNote({ _id: row.id, nom: row.nom, prenom: row.prenom }, 'controle') }}
                      >
                        {row.controle === '-' ? 'Ajouter Contrôle' : 'Modifier Contrôle'}
                      </Button>
                      <Button
                        color={row.examen === '-' ? 'success' : 'primary'}
                        size="sm"
                        className="me-1"
                        onClick={e => { e.stopPropagation(); handleAddNote({ _id: row.id, nom: row.nom, prenom: row.prenom }, 'examen') }}
                      >
                        {row.examen === '-' ? 'Ajouter Examen' : 'Modifier Examen'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : classes && classes.length === 0 ? (
            <Alert color="info">
              <h4 className="alert-heading">Aucune classe disponible</h4>
              <p>Aucune classe n'a été créée dans le système. Veuillez créer une classe avant de pouvoir gérer les notes.</p>
            </Alert>
          ) : (
            <Alert color="info">
              <h4 className="alert-heading">Sélectionnez une classe</h4>
              <p>Veuillez sélectionner une classe dans le menu déroulant ci-dessus pour voir les élèves et leurs notes.</p>
            </Alert>
          )}
          {selectedStudentId && (
            <Alert color="info" className="mt-2">
              Élève sélectionné : {tableData.find(e => e.id === selectedStudentId)?.nom} {tableData.find(e => e.id === selectedStudentId)?.prenom}
            </Alert>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)}>
        <ModalHeader toggle={() => setIsModalOpen(false)}>
          {noteType === 'controle' ? 'Modifier Note de Contrôle' : 'Modifier Note d\'Examen'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="note">Note</Label>
              <Input
                type="number"
                name="note"
                id="note"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                min="0"
                max="20"
                step="0.5"
              />
            </FormGroup>
            <Button color="primary" onClick={handleSaveNote}>
              Enregistrer
            </Button>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  )
}

export default NotesList 