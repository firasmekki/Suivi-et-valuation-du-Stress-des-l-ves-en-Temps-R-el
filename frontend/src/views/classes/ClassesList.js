import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Button,
  Badge,
  Alert,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Row,
  Col,
  Input,
  InputGroup,
  InputGroupText
} from 'reactstrap'
import { Edit, Trash2, MoreVertical, Search, Plus, Eye } from 'react-feather'
import './ClassesList.scss'

const ClassesList = () => {
  const [classes, setClasses] = useState([])
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'))
  const navigate = useNavigate()

  // Create axios config with auth header
  const getAxiosConfig = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.')
      window.location.href = '/login'
      return null
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  }

  const fetchClasses = async () => {
    try {
      const config = getAxiosConfig()
      if (!config) return

      let response
      if (userRole === 'enseignant') {
        const teacherId = localStorage.getItem('userId')
        console.log('🔍 Récupération des classes pour l\'enseignant:', teacherId)
        
        response = await axios.get(
          `http://localhost:5000/api/enseignants/${teacherId}/classes`,
          config
        )
        
        console.log('📦 Réponse du serveur:', response.data)
        
        // S'assurer que les données sont un tableau et filtrer les classes où l'enseignant enseigne
        const classesData = response.data.data || response.data || []
        console.log('📚 Données des classes avant filtrage:', classesData)
        
        // Vérifier la structure des données pour chaque classe
        classesData.forEach((classe, index) => {
          console.log(`📋 Classe ${index + 1}:`, {
            id: classe._id,
            niveau: classe.niveau,
            section: classe.section,
            eleves: {
              type: Array.isArray(classe.eleves) ? 'Array' : typeof classe.eleves,
              length: Array.isArray(classe.eleves) ? classe.eleves.length : 'N/A',
              data: classe.eleves
            },
            enseignants: {
              type: Array.isArray(classe.enseignants) ? 'Array' : typeof classe.enseignants,
              length: Array.isArray(classe.enseignants) ? classe.enseignants.length : 'N/A',
              data: classe.enseignants
            }
          })
        })
        
        const teacherClasses = Array.isArray(classesData) ? classesData.filter(classe => {
          // Vérifier si l'enseignant est dans la liste des enseignants de la classe
          const isTeacherInClass = classe.enseignants && 
                 Array.isArray(classe.enseignants) && 
                 classe.enseignants.some(ens => {
                   const ensId = ens._id?.toString() || ens._id;
                   const teacherIdStr = teacherId?.toString();
                   console.log(`🔄 Comparaison IDs - Enseignant: ${ensId}, Teacher: ${teacherIdStr}`);
                   return ensId === teacherIdStr;
                 });
          
          console.log(`🔍 Classe ${classe.niveau} ${classe.section} - Enseignant présent:`, isTeacherInClass)
          return isTeacherInClass
        }) : []
        
        console.log('📚 Classes filtrées pour l\'enseignant:', teacherClasses)
        setClasses(teacherClasses)
      } else {
        response = await axios.get('http://localhost:5000/api/classes', config)
        // S'assurer que les données sont un tableau
        const classesData = response.data.data || []
        console.log('📚 Données des classes (admin):', classesData)
        setClasses(Array.isArray(classesData) ? classesData : [])
      }
      setLoading(false)
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des classes:', err)
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.')
        window.location.href = '/login'
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la récupération des classes')
      }
      setClasses([]) // En cas d'erreur, initialiser avec un tableau vide
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔄 Chargement des classes - Role utilisateur:', userRole)
    fetchClasses()
  }, [userRole])

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      try {
        const config = getAxiosConfig()
        if (!config) return

        const response = await axios.delete(
          `http://localhost:5000/api/classes/${id}`,
          config
        )
        if (response.data.success) {
          fetchClasses() // Recharger la liste après suppression
        }
      } catch (err) {
        console.error('Erreur lors de la suppression:', err)
        if (err.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.')
          window.location.href = '/login'
        } else {
          setError(err.response?.data?.message || 'Erreur lors de la suppression')
        }
      }
    }
  }

  const getBadgeColor = (count) => {
    if (count === 0) return 'light'
    if (count < 15) return 'success'
    if (count < 25) return 'warning'
    return 'danger'
  }

  // Fonction pour obtenir le nom complet de la section
  const getFullSectionName = (shortSection) => {
    // Extraire le code de base (sans le numéro)
    const baseSection = shortSection.split(' ')[0].toLowerCase();
    const number = shortSection.split(' ')[1] || '';

    const sectionNames = {
      'tech': 'Technique',
      'eco': 'Économie et Gestion',
      'math': 'Mathématiques',
      'svt': 'Sciences de la Vie et de la Terre',
      'info': 'Informatique'
    };

    const fullName = sectionNames[baseSection] || baseSection;
    return number ? `${fullName} ${number}` : fullName;
  };

  // Filtrer les classes selon la recherche
  const filteredClasses = Array.isArray(classes) ? classes.filter(classe => {
    if (!classe || !classe.niveau || !classe.section) {
      console.log('⚠️ Classe invalide:', classe)
      return false
    }
    const searchString = searchTerm.toLowerCase()
    return (
      classe.niveau.toLowerCase().includes(searchString) ||
      classe.section.toLowerCase().includes(searchString)
    )
  }) : []

  console.log('📊 Classes filtrées finales:', filteredClasses)

  return (
    <Card>
      <CardHeader className='border-bottom'>
        <Row className='w-100 align-items-center'>
          <Col lg='4' md='12' className='mb-md-1 mb-lg-0'>
            <h4 className='mb-0'>Liste des Classes</h4>
          </Col>
          <Col lg='8' md='12' className='mb-md-1 mb-lg-0'>
            <InputGroup className='search-group'>
              <Input
                className='search-input'
                type='text'
                placeholder='Rechercher par niveau ou section...'
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
              <th>Niveau</th>
              <th>Section</th>
              <th>Effectif</th>
              {userRole === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading">
                <td colSpan='4' className='text-center'>
                  Chargement...
                </td>
              </tr>
            ) : filteredClasses.length === 0 ? (
              <tr key="no-data">
                <td colSpan='4' className='text-center'>
                  Aucune classe trouvée
                </td>
              </tr>
            ) : (
              filteredClasses.map((classe, index) => {
                // Calculer le nombre d'élèves
                const nbEleves = Array.isArray(classe.eleves) ? classe.eleves.length : 0
                console.log(`📊 Classe ${classe.niveau} ${classe.section} - Élèves:`, {
                  total: nbEleves,
                  eleves: classe.eleves,
                  id: classe._id || classe.id
                })

                const classeId = classe._id || classe.id
                if (!classeId) {
                  console.error('❌ Classe sans ID:', classe)
                  return null
                }

                return (
                  <tr key={classeId}>
                    <td onClick={() => navigate(`/class-students/${classeId}`)} style={{ cursor: 'pointer' }}>{classe.niveau}</td>
                    <td onClick={() => navigate(`/class-students/${classeId}`)} style={{ cursor: 'pointer' }}>{classe.section}</td>
                    <td onClick={() => navigate(`/class-students/${classeId}`)} style={{ cursor: 'pointer' }}>
                      <Badge color={getBadgeColor(nbEleves)} pill>
                        {nbEleves} élève{nbEleves > 1 ? 's' : ''}
                      </Badge>
                    </td>
                    {userRole === 'admin' && (
                      <td>
                        <div className="d-flex gap-1">
                          <Button color="info" size="sm" tag={Link} to={`/class-students/${classeId}`}>
                            <Eye size={16} />
                          </Button>
                          <Button color="warning" size="sm" tag={Link} to={`/edit-classe/${classeId}`}>
                            <Edit size={16} />
                          </Button>
                          <Button color="danger" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(classeId);
                          }}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </Table>
      </CardBody>
    </Card>
  )
}

export default ClassesList 