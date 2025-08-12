import { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Select from 'react-select'

const AddTeacher = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successDetails, setSuccessDetails] = useState(null)
  const [classes, setClasses] = useState([])
  const [selectedClasses, setSelectedClasses] = useState([])
  const [availableClasses, setAvailableClasses] = useState([])
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    matiere: '',
    adresse: '',
    telephone: '',
    email: ''
  })
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  // Charger les classes depuis l'API
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        console.log('Début du chargement des classes')
        const response = await axios.get('http://localhost:5000/api/classes')
        console.log('Données reçues:', response.data)

        if (response.data.success && Array.isArray(response.data.data)) {
          const formattedClasses = response.data.data
            .filter(classe => {
              if (!classe || !classe.niveau || !classe.section) {
                console.log('Classe invalide:', classe)
                return false
              }
              return true
            })
            .map(classe => ({
              value: classe.id || classe._id,
              label: `${formatNiveau(classe.niveau)} ${formatSectionName(classe.section)}`
            }))

          console.log('Classes formatées:', formattedClasses)
          
          if (formattedClasses.length === 0) {
            console.log('Aucune classe n\'a été formatée correctement')
            setError('Aucune classe disponible')
          } else {
            setClasses(formattedClasses)
            setAvailableClasses(formattedClasses)
            setError(null)
          }
        } else {
          console.error('Format de réponse invalide:', response.data)
          setError('Format de données invalide')
        }
      } catch (err) {
        console.error('Erreur lors du chargement des classes:', err)
        setError('Erreur lors du chargement des classes')
        toast.error('Impossible de charger les classes')
      }
    }

    fetchClasses()
  }, [])

  // Mettre à jour les classes disponibles lorsque les sélections changent
  useEffect(() => {
    const updateAvailableClasses = () => {
      const selectedIds = new Set(selectedClasses.map(sc => sc.value))
      const filteredClasses = classes.filter(c => !selectedIds.has(c.value))
      setAvailableClasses(filteredClasses)
    }
    updateAvailableClasses()
  }, [selectedClasses, classes])

  // Vérifier si l'email existe déjà
  const checkEmailExists = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/enseignants`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data.some(teacher => teacher.email === email)
      }
      return false
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'email:', err)
      return false
    }
  }

  // Vérifier l'email avec debounce
  const handleEmailChange = async (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'email' && value.trim() !== '') {
      // Attendre que l'utilisateur finisse de taper
      setIsCheckingEmail(true)
      // Attendre 500ms avant de vérifier
      setTimeout(async () => {
        const emailExists = await checkEmailExists(value.trim())
        if (emailExists) {
          setError('Cet email est déjà utilisé par un autre enseignant')
        } else {
          setError(null)
        }
        setIsCheckingEmail(false)
      }, 500)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    try {
      setSubmitting(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        setError('Session expirée. Veuillez vous reconnecter.')
        return
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('L\'adresse email n\'est pas valide')
        return
      }

      // Vérifier si l'email existe déjà avant de soumettre
      const emailExists = await checkEmailExists(formData.email.trim())
      if (emailExists) {
        setError('Un enseignant avec cet email existe déjà')
        return
      }

      // Validation du numéro de téléphone (8 chiffres)
      const phoneRegex = /^\d{8}$/
      if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
        setError('Le numéro de téléphone doit contenir 8 chiffres')
        return
      }

      // Extraire les IDs des classes sélectionnées
      const classIds = selectedClasses.map(option => option.value).filter(Boolean)
      console.log('IDs des classes à envoyer:', classIds)

      // Préparer les données
      const teacherData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        dateNaissance: formData.dateNaissance,
        matiere: formData.matiere,
        adresse: formData.adresse.trim(),
        telephone: formData.telephone.replace(/\s/g, ''),
        email: formData.email.trim().toLowerCase(),
        classes: classIds
      }

      console.log('📤 Données de l\'enseignant:', teacherData)

      const response = await axios.post(
        'http://localhost:5000/api/enseignants',
        teacherData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        setSuccess(true)
        // Vérifier si les données nécessaires existent dans la réponse
        const teacherResponse = response.data.data || {}
        setSuccessDetails({
          id: teacherResponse._id || teacherResponse.id || 'ID non disponible',
          email: teacherResponse.email || formData.email,
          password: teacherResponse.tempPassword || 'Mot de passe temporaire non disponible'
        })
        setShowSuccessModal(true)
        toast.success('Enseignant créé avec succès')
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création de l\'enseignant')
      }
    } catch (err) {
      console.error('❌ Erreur:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la création de l\'enseignant'
      console.error('Détails de l\'erreur:', err.response?.data)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleClassesChange = (selectedOptions) => {
    console.log('🔄 Options de classes sélectionnées:', selectedOptions)
    const newSelectedClasses = selectedOptions || []
    setSelectedClasses(newSelectedClasses)
  }

  const formatNiveau = (niveau) => {
    if (!niveau) return ''
    
    const niveauMap = {
      'bac': 'Bac',
      '3eme': '3ème',
      '2eme': '2ème',
      '1ere': '1ère'
    }
    return niveauMap[niveau.toLowerCase()] || niveau
  }

  const formatSectionName = (section) => {
    if (!section) return ''
    
    const sectionMap = {
      'tech': 'Technique',
      'eco': 'Économique',
      'sc': 'Sciences',
      'let': 'Lettres',
      'm': 'Mathématiques',
      'info': 'Informatique',
      'svt': 'Sciences de la Vie et de la Terre'
    }
    return sectionMap[section.toLowerCase()] || section
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Enseignant</CardTitle>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label for='nom'>Nom</Label>
                  <Input
                    id='nom'
                    name='nom'
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='prenom'>Prénom</Label>
                  <Input
                    id='prenom'
                    name='prenom'
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label for='dateNaissance'>Date de Naissance</Label>
                  <Input
                    type='date'
                    id='dateNaissance'
                    name='dateNaissance'
                    value={formData.dateNaissance}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='matiere'>Matière</Label>
                  <Input
                    type='select'
                    id='matiere'
                    name='matiere'
                    value={formData.matiere}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner une matière</option>
                    <option value="Mathématiques">Mathématiques</option>
                    <option value="Physique">Physique</option>
                    <option value="SVT">SVT</option>
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Histoire-Géographie">Histoire-Géographie</option>
                    <option value="Informatique">Informatique</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for='adresse'>Adresse</Label>
              <Input
                type='textarea'
                id='adresse'
                name='adresse'
                value={formData.adresse}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label for='telephone'>Téléphone</Label>
                  <Input
                    id='telephone'
                    name='telephone'
                    value={formData.telephone}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='email'>Email</Label>
                  <Input
                    type='email'
                    id='email'
                    name='email'
                    value={formData.email}
                    onChange={handleEmailChange}
                    required
                    invalid={error && error.includes('email')}
                  />
                  {isCheckingEmail && (
                    <small className="text-muted">
                      Vérification de l'email...
                    </small>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for='classes'>Classes</Label>
              <Select
                isMulti
                id='classes'
                name='classes'
                value={selectedClasses}
                onChange={handleClassesChange}
                options={availableClasses}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder="Sélectionner les classes"
                isClearable={true}
                isSearchable={true}
                closeMenuOnSelect={false}
                hideSelectedOptions={true}
                menuPlacement="auto"
                menuPortalTarget={document.body}
                noOptionsMessage={() => "Aucune classe disponible"}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    borderColor: '#d8d6de',
                    '&:hover': {
                      borderColor: '#d8d6de'
                    }
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected ? '#f8f8f8' : 'white',
                    color: '#333',
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                      cursor: 'pointer'
                    },
                    padding: '8px 12px'
                  }),
                  multiValue: (provided) => ({
                    ...provided,
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    margin: '2px'
                  }),
                  multiValueLabel: (provided) => ({
                    ...provided,
                    color: '#333',
                    padding: '2px 6px'
                  }),
                  multiValueRemove: (provided) => ({
                    ...provided,
                    color: '#666',
                    '&:hover': {
                      backgroundColor: '#ddd',
                      color: '#333'
                    }
                  }),
                  menuList: (provided) => ({
                    ...provided,
                    padding: '5px',
                    backgroundColor: 'white'
                  })
                }}
              />
            </FormGroup>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                color='secondary' 
                onClick={() => navigate('/teachers')}
                disabled={submitting}
                type="button"
              >
                Annuler
              </Button>
              <Button 
                color='primary' 
                type='submit'
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Création en cours...
                  </>
                ) : (
                  'Créer'
                )}
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>

      <Modal isOpen={showSuccessModal} toggle={() => setShowSuccessModal(!showSuccessModal)}>
        <ModalHeader toggle={() => setShowSuccessModal(!showSuccessModal)}>
          Enseignant créé avec succès
        </ModalHeader>
        <ModalBody>
          <p>L'enseignant a été créé avec succès. Voici les informations de connexion :</p>
          <p><strong>Email :</strong> {successDetails?.email}</p>
          <p><strong>Mot de passe temporaire :</strong> {successDetails?.password}</p>
          <Alert color="warning">
            Veuillez noter ces informations. Le mot de passe devra être changé à la première connexion.
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="primary" 
            onClick={() => {
              setShowSuccessModal(false)
              navigate('/teachers')
            }}
          >
            Compris
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default AddTeacher 