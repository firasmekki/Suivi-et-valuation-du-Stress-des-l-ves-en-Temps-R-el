import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Input,
  InputGroup,
  InputGroupText,
  Row,
  Col,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap'
import { MoreVertical, Edit, Trash, Search, Eye } from 'react-feather'
import './Parents.scss'
import { useNavigate } from 'react-router-dom'

const Parents = () => {
  const [parents, setParents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [deleteModal, setDeleteModal] = useState(false)
  const [parentToDelete, setParentToDelete] = useState(null)

  // Charger la liste des parents
  const loadParents = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:5000/api/parents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      // S'assurer que nous avons un tableau de parents
      setParents(Array.isArray(response.data.data) ? response.data.data : [])
    } catch (error) {
      console.error('Erreur lors du chargement des parents:', error)
      setError('Erreur lors du chargement des parents. Veuillez réessayer.')
      setParents([]) // Initialiser avec un tableau vide en cas d'erreur
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParents()
  }, [])

  const openDeleteModal = (id) => {
    setParentToDelete(id)
    setDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setDeleteModal(false)
    setParentToDelete(null)
  }

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:5000/api/parents/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      loadParents()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setError('Erreur lors de la suppression. Veuillez réessayer.')
    } finally {
      closeDeleteModal()
    }
  }

  // Filtrer les parents selon la recherche
  const filteredParents = parents.filter(parent => {
    try {
      // Diviser le terme de recherche en mots individuels
      const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/)
      
      // Si pas de terme de recherche, retourner tous les parents
      if (searchTerms.length === 0 || (searchTerms.length === 1 && searchTerms[0] === '')) {
        return true
      }

      // Créer une chaîne de recherche combinée pour le nom complet
      const fullName = `${parent.nom} ${parent.prenom}`.toLowerCase()
      const reverseFullName = `${parent.prenom} ${parent.nom}`.toLowerCase()
      
      // Vérifier si tous les termes de recherche sont présents
      return searchTerms.every(term => {
        const searchString = term.toLowerCase()
        
        return (
          // Recherche dans le nom complet (dans les deux sens)
          fullName.includes(searchString) ||
          reverseFullName.includes(searchString) ||
          
          // Recherche dans les champs individuels
          parent.nom?.toLowerCase().includes(searchString) ||
          parent.prenom?.toLowerCase().includes(searchString) ||
          parent.email?.toLowerCase().includes(searchString) ||
          parent.telephone?.toLowerCase().includes(searchString)
        )
      })
    } catch (error) {
      console.error('Erreur lors du filtrage d\'un parent:', error)
      return false
    }
  })

  return (
    <Card>
      <CardHeader className='border-bottom'>
        <Row className='w-100 align-items-center'>
          <Col lg='4' md='12' className='mb-md-1 mb-lg-0'>
            <h4 className='mb-0'>Liste des Parents</h4>
          </Col>
          <Col lg='8' md='12' className='mb-md-1 mb-lg-0'>
            <InputGroup className='search-group'>
              <Input
                className='search-input'
                type='text'
                placeholder='Rechercher par nom, prénom ou email...'
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
        {error && <Alert color="danger">{error}</Alert>}
        <Table responsive hover>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Nombre d'enfants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan='6' className='text-center'>
                  Chargement...
                </td>
              </tr>
            ) : filteredParents.length === 0 ? (
              <tr>
                <td colSpan='6' className='text-center'>
                  Aucun parent trouvé
                </td>
              </tr>
            ) : (
              filteredParents.map(parent => (
                <tr key={parent._id}>
                  <td>{parent.nom}</td>
                  <td>{parent.prenom}</td>
                  <td>{parent.email}</td>
                  <td>{parent.telephone}</td>
                  <td>{parent.enfants?.length || 0}</td>
                  <td className='d-flex gap-1'>
                    <Button
                      color="info"
                      size="sm"
                      onClick={() => navigate(`/parent-details/${parent._id}`)}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      color="warning"
                      size="sm"
                      onClick={() => navigate(`/edit-parent/${parent._id}`)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => openDeleteModal(parent._id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        {/* Modal de confirmation de suppression */}
        <Modal isOpen={deleteModal} toggle={closeDeleteModal} centered>
          <ModalHeader toggle={closeDeleteModal} className='text-danger'>
            <Trash size={32} className='me-2' /> Confirmation de suppression
          </ModalHeader>
          <ModalBody>
            Êtes-vous sûr de vouloir supprimer ce parent ? Cette action est irréversible.
          </ModalBody>
          <ModalFooter>
            <Button color='danger' onClick={() => handleDelete(parentToDelete)}>
              <Trash size={16} className='me-1' /> Supprimer
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

export default Parents 