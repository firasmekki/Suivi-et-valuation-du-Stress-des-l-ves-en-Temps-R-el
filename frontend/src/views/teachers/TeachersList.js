import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody, CardTitle, Table, Button, Spinner, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Row, Col, Input, InputGroup, InputGroupText, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { Edit, Trash2, MoreVertical, Search, Plus, Eye } from 'react-feather'
import { Link } from 'react-router-dom'
import api from '@src/configs/api'
import toast from 'react-hot-toast'
import './TeachersList.scss'

const TeachersList = () => {
  const [teachers, setTeachers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState(null)

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/api/enseignants')
      
      if (!response.data.success || !Array.isArray(response.data.data)) {
        console.error('Format de réponse invalide:', response.data)
        setError('Format de données incorrect')
        return
      }

      setTeachers(response.data.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des enseignants:', err)
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.')
        // Redirect to login page
        window.location.href = '/login'
      } else {
      setError('Erreur lors de la récupération des enseignants')
      toast.error('Erreur lors de la récupération des enseignants')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  // Nouvelle fonction pour la recherche
  const handleSearch = async (value) => {
    setSearchTerm(value)
    try {
      if (!value.trim()) {
        // Si la recherche est vide, afficher tous les enseignants
        fetchTeachers()
        return
      }
      
      setLoading(true)
      const response = await api.get(`/api/enseignants/search?q=${value}`)
      if (Array.isArray(response.data)) {
        setTeachers(response.data)
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      setError('Erreur lors de la recherche')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (id) => {
    setTeacherToDelete(id)
    setDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setDeleteModal(false)
    setTeacherToDelete(null)
  }

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/api/enseignants/${id}`)
      if (response.data.success) {
        toast.success('Enseignant supprimé avec succès')
        fetchTeachers()
      } else {
        toast.error(response.data.message || 'Erreur lors de la suppression')
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      toast.error('Erreur lors de la suppression de l\'enseignant')
    } finally {
      closeDeleteModal()
    }
  }

  return (
    <Card>
      <CardHeader className='border-bottom'>
        <Row className='w-100 align-items-center'>
          <Col lg='4' md='12' className='mb-md-1 mb-lg-0'>
            <h4 className='mb-0'>Liste des Enseignants</h4>
          </Col>
          <Col lg='8' md='12' className='mb-md-1 mb-lg-0'>
            <InputGroup className='search-group'>
              <Input
                className='search-input'
                type='text'
                placeholder='Rechercher par nom, prénom ou matière...'
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
              />
              <InputGroupText className='search-icon'>
                <Search size={18} />
              </InputGroupText>
            </InputGroup>
          </Col>
        </Row>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className='text-center my-3'>
            <Spinner />
          </div>
        ) : error ? (
          <div className='text-center text-danger my-3'>
            {error}
          </div>
        ) : teachers.length === 0 ? (
          <div className='text-center my-3'>
            Aucun enseignant trouvé
          </div>
        ) : (
          <Table responsive>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Matière</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher._id}>
                  <td>{teacher.nom}</td>
                  <td>{teacher.prenom}</td>
                  <td>{teacher.matiere}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.telephone}</td>
                  <td className='d-flex gap-1'>
                    <Link to={`/teacher-details/${teacher._id}`}>
                      <Button.Ripple color='info'>
                        <Eye size={16} />
                      </Button.Ripple>
                    </Link>
                    <Link to={`/edit-teacher/${teacher._id}`}>
                      <Button.Ripple color='warning'>
                        <Edit size={16} />
                      </Button.Ripple>
                    </Link>
                    <Button.Ripple 
                      color='danger'
                      onClick={() => openDeleteModal(teacher._id)}
                    >
                      <Trash2 size={16} />
                    </Button.Ripple>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
      {/* Modal de confirmation de suppression */}
      <Modal isOpen={deleteModal} toggle={closeDeleteModal} centered>
        <ModalHeader toggle={closeDeleteModal} className='text-danger'>
          <Trash2 size={32} className='me-2' /> Confirmation de suppression
        </ModalHeader>
        <ModalBody>
          Êtes-vous sûr de vouloir supprimer cet enseignant ? Cette action est irréversible.
        </ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={() => handleDelete(teacherToDelete)}>
            <Trash2 size={16} className='me-1' /> Supprimer
          </Button>
          <Button color='secondary' onClick={closeDeleteModal}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>
    </Card>
  )
}

export default TeachersList 