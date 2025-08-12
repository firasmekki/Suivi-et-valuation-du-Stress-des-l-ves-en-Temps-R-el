import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Button,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Row,
  Col,
  Input,
  InputGroup,
  InputGroupText,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap'
import { Edit, Trash2, Eye, MoreVertical, Search, Plus } from 'react-feather'
import './StudentsList.scss'

const StudentsList = () => {
  const [students, setStudents] = useState([])
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'))
  const [teacherClasses, setTeacherClasses] = useState([])
  const [infoMessage, setInfoMessage] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)

  // Create axios config with auth header
  const getAxiosConfig = () => {
    const token = localStorage.getItem('token')
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  }

  const fetchTeacherClasses = async () => {
    try {
      const teacherId = localStorage.getItem('userId')
      const response = await axios.get(
        `http://localhost:5000/api/enseignants/${teacherId}/classes`,
        getAxiosConfig()
      )
      
      // Vérifier si la réponse contient des données valides
      if (response.data && response.data.data) {
        setTeacherClasses(response.data.data)
        
        // Si l'enseignant n'a pas de classes, définir un message d'information
        if (response.data.data.length === 0) {
          setInfoMessage("Vous n'avez pas encore de classes assignées. La liste montre tous les élèves, mais vous ne pourrez interagir qu'avec les élèves de vos classes une fois qu'elles seront assignées.")
        } else {
          setInfoMessage('') // Effacer le message si l'enseignant a des classes
        }
      } else {
        console.error('Format de réponse invalide:', response.data)
        setError('Erreur lors de la récupération des classes')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error)
      setError(error.response?.data?.message || 'Erreur lors de la récupération des classes')
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/eleves/getalleleves',
        getAxiosConfig()
      )
      console.log('📦 Réponse du serveur:', response.data)

      if (!response.data || (!response.data.data && !Array.isArray(response.data))) {
        console.error('❌ Pas de données dans la réponse:', response.data)
        setError('Aucun élève trouvé')
        setStudents([])
        return
      }

      const elevesData = response.data.data || response.data
      console.log('📚 Données des élèves:', elevesData)

      let eleves = elevesData.map(eleve => {
        console.log('🎓 Traitement élève:', eleve)
        return {
          id: eleve._id,
          nom: eleve.nom,
          prenom: eleve.prenom,
          classe: eleve.classe ? `${eleve.classe.niveau} ${eleve.classe.section}` : 'Non assigné',
          classeId: eleve.classe?._id,
          email: eleve.email,
          parentNom: eleve.parent ? eleve.parent.nom : 'Non assigné',
          photo: eleve.photo ? `http://localhost:5000${eleve.photo}` : null,
          isInTeacherClass: false
        }
      })

      // Si c'est un enseignant, marquer les élèves qui sont dans ses classes
      if (userRole === 'enseignant' && teacherClasses.length > 0) {
        const teacherClassIds = teacherClasses.map(c => c._id)
        console.log('👨‍🏫 Classes de l\'enseignant:', teacherClassIds)
        
        eleves = eleves.map(eleve => ({
          ...eleve,
          isInTeacherClass: eleve.classeId && teacherClassIds.includes(eleve.classeId)
        }))
      }

      console.log('📊 Liste finale des élèves:', eleves)
      setStudents(eleves)
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des élèves:', err)
      setError(err.response?.data?.message || 'Erreur lors de la récupération des élèves')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (userRole === 'enseignant') {
        await fetchTeacherClasses()
      }
      await fetchStudents()
    }
    init()
  }, [userRole])

  const openDeleteModal = (id) => {
    setStudentToDelete(id)
    setDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setDeleteModal(false)
    setStudentToDelete(null)
  }

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/eleves/deleteeleve/${id}`,
        getAxiosConfig()
      )
      if (response.data.success) {
        fetchStudents()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setError(error.response?.data?.message || 'Erreur lors de la suppression')
    } finally {
      closeDeleteModal()
    }
  }

  // Filtrer les élèves selon la recherche
  const filteredStudents = students.filter(student => {
    try {
      // Diviser le terme de recherche en mots individuels
      const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/)
      
      // Si pas de terme de recherche, retourner tous les élèves
      if (searchTerms.length === 0 || (searchTerms.length === 1 && searchTerms[0] === '')) {
        return true
      }

      // Créer une chaîne de recherche combinée pour le nom complet
      const fullName = `${student.nom} ${student.prenom}`.toLowerCase()
      const reverseFullName = `${student.prenom} ${student.nom}`.toLowerCase()
      
      // Vérifier si tous les termes de recherche sont présents
      return searchTerms.every(term => {
        const searchString = term.toLowerCase()
        
        return (
          // Recherche dans le nom complet (dans les deux sens)
          fullName.includes(searchString) ||
          reverseFullName.includes(searchString) ||
          
          // Recherche dans les champs individuels
          student.nom?.toLowerCase().includes(searchString) ||
          student.prenom?.toLowerCase().includes(searchString) ||
          student.email?.toLowerCase().includes(searchString) ||
          student.classe?.toLowerCase().includes(searchString) ||
          student.parentNom?.toLowerCase().includes(searchString)
        )
      })
    } catch (error) {
      console.error('Erreur lors du filtrage d\'un élève:', error)
      return false
    }
  })

  return (
    <Card>
      <CardHeader className='border-bottom'>
        <Row className='w-100 align-items-center'>
          <Col lg='4' md='12' className='mb-md-1 mb-lg-0'>
            <h4 className='mb-0'>Liste des Élèves</h4>
          </Col>
          <Col lg='8' md='12' className='mb-md-1 mb-lg-0'>
            <InputGroup className='search-group'>
              <Input
                className='search-input'
                type='text'
                placeholder='Rechercher un élève...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <InputGroupText className='search-icon'>
                <Search size={18} />
              </InputGroupText>
            </InputGroup>
          </Col>
        </Row>
      </CardHeader>
      <CardBody>
        {error && (
          <Alert color="danger">
            {error}
          </Alert>
        )}
        {infoMessage && (
          <Alert color="info">
            {infoMessage}
          </Alert>
        )}
        <div className="table-responsive">
          <Table hover className='table-striped'>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Classe</th>
                <th>Email</th>
                <th>Parent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan='7' className='text-center'>
                    Chargement...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan='7' className='text-center'>
                    {searchTerm ? 'Aucun élève ne correspond à votre recherche' : 'Aucun élève trouvé'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className={student.isInTeacherClass ? 'bg-light-success' : ''}>
                    <td>
                      {student.photo ? (
                        <img 
                          src={student.photo} 
                          alt={`${student.prenom}`} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            backgroundColor: '#f8f8f8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {student.nom[0]}
                        </div>
                      )}
                    </td>
                    <td>{student.nom}</td>
                    <td>{student.prenom}</td>
                    <td>{student.classe}</td>
                    <td>{student.email}</td>
                    <td>{student.parentNom}</td>
                    <td>
                      <div className='d-flex gap-1'>
                        <Link to={`/student/${student.id}`}>
                          <Button color='info' size='sm' disabled={userRole === 'enseignant' && !student.isInTeacherClass}>
                            <Eye size={16} />
                          </Button>
                        </Link>
                        {userRole === 'admin' && (
                          <>
                            <Link to={`/edit-student/${student.id}`}>
                              <Button color='warning' size='sm'>
                                <Edit size={16} />
                              </Button>
                            </Link>
                            <Button 
                              color='danger' 
                              size='sm'
                              onClick={() => openDeleteModal(student.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
        {/* Modal de confirmation de suppression */}
        <Modal isOpen={deleteModal} toggle={closeDeleteModal} centered>
          <ModalHeader toggle={closeDeleteModal} className='text-danger'>
            <Trash2 size={32} className='me-2' /> Confirmation de suppression
          </ModalHeader>
          <ModalBody>
            Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible.
          </ModalBody>
          <ModalFooter>
            <Button color='danger' onClick={() => handleDelete(studentToDelete)}>
              <Trash2 size={16} className='me-1' /> Supprimer
            </Button>
            <Button color='secondary' onClick={closeDeleteModal}>
              Annuler
            </Button>
          </ModalFooter>
        </Modal>
      </CardBody>
    </Card>
  )
}

export default StudentsList 