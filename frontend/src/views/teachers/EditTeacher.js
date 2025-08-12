import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Spinner
} from 'reactstrap'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'

const EditTeacher = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
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
    email: '',
    selectedClasses: []
  })

  // Charger les classes disponibles
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Session expirée. Veuillez vous reconnecter.')
          return
        }

        const response = await axios.get('http://localhost:5000/api/classes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data.success) {
          // Format the classes data
          const formattedClasses = response.data.data.map(classe => ({
            _id: classe.id || classe._id,
            niveau: classe.niveau,
            section: classe.section
          }))
          setClasses(formattedClasses)
          setAvailableClasses(formattedClasses)
        }
      } catch (err) {
        console.error('Erreur lors du chargement des classes:', err)
        toast.error('Erreur lors du chargement des classes')
      }
    }

    fetchClasses()
  }, [])

  // Charger les données de l'enseignant
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          setError('Session expirée. Veuillez vous reconnecter.')
          navigate('/login')
          return
        }

        const response = await axios.get(
          `http://localhost:5000/api/enseignants/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (!response.data.success) {
          setError('Erreur lors de la récupération des données')
          return
        }

        const teacherData = response.data.data
        
        setFormData({
          nom: teacherData.nom,
          prenom: teacherData.prenom,
          dateNaissance: teacherData.dateNaissance.split('T')[0],
          matiere: teacherData.matiere,
          adresse: teacherData.adresse,
          telephone: teacherData.telephone,
          email: teacherData.email,
          selectedClasses: teacherData.classes || []
        })

        // Mettre à jour les classes sélectionnées
        if (classes.length > 0) {
          const teacherClasses = teacherData.classes || []
          const selectedOptions = classes
            .filter(classe => teacherClasses.includes(classe._id))
            .map(classe => ({
              value: classe._id,
              label: `${formatNiveau(classe.niveau)} ${formatSectionName(classe.section)}`
            }))
          setSelectedClasses(selectedOptions)

          // Mettre à jour les classes disponibles
          const remainingClasses = classes.filter(classe => !teacherClasses.includes(classe._id))
          setAvailableClasses(remainingClasses)
        }
      } catch (err) {
        console.error('Erreur lors de la récupération:', err)
        if (err.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.')
          navigate('/login')
        } else {
          setError('Erreur lors de la récupération des données')
          toast.error('Erreur lors de la récupération des données')
        }
      } finally {
        setLoading(false)
      }
    }

    if (classes.length > 0) {
      fetchTeacher()
    }
  }, [id, navigate, classes])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(false)

      const token = localStorage.getItem('token')
      if (!token) {
        setError('Session expirée. Veuillez vous reconnecter.')
        navigate('/login')
        return
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('L\'adresse email n\'est pas valide')
        setSubmitting(false)
        return
      }

      // Validation du numéro de téléphone (8 chiffres)
      const phoneRegex = /^\d{8}$/
      if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
        setError('Le numéro de téléphone doit contenir 8 chiffres')
        setSubmitting(false)
        return
      }

      // Nettoyer les données
      const cleanedData = {
        ...formData,
        telephone: formData.telephone.replace(/\s/g, ''),
        email: formData.email.trim().toLowerCase(),
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        adresse: formData.adresse.trim(),
        classes: selectedClasses.map(option => option.value)
      }

      console.log('🔄 Classes sélectionnées:', selectedClasses)
      console.log('📤 Classes envoyées au serveur:', cleanedData.classes)

      const response = await axios.put(
        `http://localhost:5000/api/enseignants/${id}`,
        cleanedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('📥 Réponse du serveur:', response.data)

      if (response.data.success) {
        setSuccess(true)
        toast.success('Enseignant modifié avec succès!')
        
        // Attendre un peu avant de rediriger pour voir les classes mises à jour
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Vérifier les classes mises à jour
        const updatedTeacher = await axios.get(
          `http://localhost:5000/api/enseignants/${id}/classes`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        console.log('📚 Classes après mise à jour:', updatedTeacher.data)
        
        setTimeout(() => {
          navigate('/teachers')
        }, 500)
      } else {
        setError(response.data.message || 'Erreur lors de la modification de l\'enseignant')
        toast.error(response.data.message || 'Erreur lors de la modification de l\'enseignant')
      }
    } catch (err) {
      console.error('Erreur:', err)
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.')
        navigate('/login')
      } else {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Erreur lors de la modification de l\'enseignant'
      setError(errorMessage)
      toast.error(errorMessage)
      }
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
    setSelectedClasses(selectedOptions || [])
    
    // Mettre à jour les classes disponibles
    const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : []
    const remainingClasses = classes.filter(classe => !selectedIds.includes(classe._id))
    setAvailableClasses(remainingClasses)
    
    // Mettre à jour formData
    setFormData(prevState => ({
      ...prevState,
      classes: selectedIds
    }))
  }

  // Fonction pour formater le nom de la section
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
    const [baseSection, number] = section.toLowerCase().trim().split(/\s+/)
    const formattedBase = sectionMap[baseSection] || baseSection
    return number ? `${formattedBase} ${number}` : formattedBase
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

  if (loading) {
    return (
      <div className="text-center my-3">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Modifier l'Enseignant</CardTitle>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}
          {success && (
            <Alert color="success" className="mb-4">
              Enseignant modifié avec succès! Redirection...
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
                    onChange={handleChange}
                    required
                  />
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
                options={availableClasses.map(classe => ({
                  value: classe._id,
                  label: `${formatNiveau(classe.niveau)} ${formatSectionName(classe.section)}`
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder="Sélectionner les classes"
                isClearable={true}
                isSearchable={true}
                closeMenuOnSelect={false}
                hideSelectedOptions={true}
                menuPlacement="auto"
                menuPortalTarget={document.body}
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
                disabled={submitting || success}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Enregistrement...
                  </>
                ) : success ? (
                  'Enregistré !'
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  )
}

export default EditTeacher 