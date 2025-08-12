import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
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
  Alert
} from 'reactstrap'
import { Upload } from 'react-feather'

const EditStudent = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState({
    // Informations de l'élève
    nom: '',
    prenom: '',
    dateNaissance: '',
    classe: '',
    adresse: '',
    telephone: '',
    email: '',
    // Photo de profil
    photo: null,
    // Informations du parent
    parentNom: '',
    parentPrenom: '',
    parentEmail: '',
    parentAdresse: '',
    parentTelephone: ''
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Charger les classes
    const fetchClasses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/classes')
        if (response.data.success) {
          setClasses(response.data.data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error)
        setError('Erreur lors du chargement des classes')
      }
    }

    // Charger les données de l'élève
    const fetchEleve = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/eleves/getelevebyid/${id}`)
        const eleve = response.data.data
        
        // S'assurer que toutes les valeurs sont définies
        setFormData({
          nom: eleve.nom || '',
          prenom: eleve.prenom || '',
          dateNaissance: eleve.dateNaissance ? eleve.dateNaissance.split('T')[0] : '',
          classe: eleve.classe?._id || '',
          adresse: eleve.adresse || '',
          telephone: eleve.telephone || '',
          email: eleve.email || '',
          photo: null,
          parentNom: eleve.parent?.nom || '',
          parentPrenom: eleve.parent?.prenom || '',
          parentEmail: eleve.parent?.email || '',
          parentAdresse: eleve.parent?.adresse || '',
          parentTelephone: eleve.parent?.telephone || ''
        })
        
        if (eleve.photo) {
          setPreview(`http://localhost:5000${eleve.photo}`)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération:', error)
        setError(error.response?.data?.message || 'Erreur lors de la récupération des données')
      } finally {
        setIsLoading(false)
      }
    }

    // Charger les deux en parallèle
    Promise.all([fetchClasses(), fetchEleve()])
  }, [id])

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({
        ...formData,
        photo: file
      })

      // Créer l'URL de prévisualisation
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const formDataToSend = new FormData()
      
      // Ajouter tous les champs, même vides
      Object.keys(formData).forEach(key => {
        if (key === 'photo' && formData[key]) {
          formDataToSend.append('photo', formData[key])
        } else {
          // Envoyer une chaîne vide si la valeur est undefined ou null
          formDataToSend.append(key, formData[key] || '')
        }
      })

      const token = localStorage.getItem('token')
      if (!token) {
        setError('Session expirée. Veuillez vous reconnecter.')
        navigate('/login')
        return
      }

      const response = await axios.put(
        `http://localhost:5000/api/eleves/updateeleve/${id}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setSuccessMessage("L'élève a été mis à jour avec succès.")
        setTimeout(() => {
          navigate('/students')
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Erreur lors de la mise à jour'
      setError(errorMessage)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (isLoading) {
    return <div>Chargement...</div>
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Modifier un Élève</CardTitle>
        </CardHeader>
        <CardBody>
          {successMessage && (
            <Alert color="success" className="mb-4">
              {successMessage}
            </Alert>
          )}
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            {/* Photo de profil */}
            <div className='mb-4 d-flex flex-column align-items-center'>
              <div 
                className='position-relative' 
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px dashed #7367f0',
                  marginBottom: '1rem'
                }}
              >
                {preview ? (
                  <img 
                    src={preview} 
                    alt="Photo de profil" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div 
                    className='d-flex flex-column align-items-center justify-content-center'
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#f8f8f8'
                    }}
                  >
                    <Upload size={50} className='text-primary' />
                    <small className='text-muted mt-1'>Cliquez pour changer la photo</small>
                  </div>
                )}
                <Input
                  type='file'
                  id='photo'
                  name='photo'
                  onChange={handlePhotoChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                  accept='image/*'
                />
              </div>
            </div>

            {/* Informations de l'élève */}
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
                  <Label for='classe'>Classe</Label>
                  <Input
                    type='select'
                    id='classe'
                    name='classe'
                    value={formData.classe}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map((classe, index) => {
                      // Create a unique key using multiple properties or index as fallback
                      const uniqueKey = classe._id ? 
                        `classe-${classe._id}` : 
                        `classe-${classe.niveau}-${classe.section}-${index}`
                      
                      return (
                        <option key={uniqueKey} value={classe._id || ''}>
                          {classe.niveau} {classe.section}
                        </option>
                      )
                    })}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md='12'>
                <FormGroup>
                  <Label for='adresse'>Adresse</Label>
                  <Input
                    id='adresse'
                    name='adresse'
                    value={formData.adresse}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

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

            {/* Informations du parent */}
            <h5 className='mt-4'>Informations du Parent</h5>
            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label for='parentNom'>Nom du Parent</Label>
                  <Input
                    id='parentNom'
                    name='parentNom'
                    value={formData.parentNom}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='parentPrenom'>Prénom du Parent</Label>
                  <Input
                    id='parentPrenom'
                    name='parentPrenom'
                    value={formData.parentPrenom}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md='12'>
                <FormGroup>
                  <Label for='parentAdresse'>Adresse du Parent</Label>
                  <Input
                    id='parentAdresse'
                    name='parentAdresse'
                    value={formData.parentAdresse}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label for='parentTelephone'>Téléphone du Parent</Label>
                  <Input
                    id='parentTelephone'
                    name='parentTelephone'
                    value={formData.parentTelephone}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='parentEmail'>Email du Parent</Label>
                  <Input
                    type='email'
                    id='parentEmail'
                    name='parentEmail'
                    value={formData.parentEmail}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <div className='d-flex justify-content-end mt-4'>
              <Button color='secondary' className='me-2' onClick={() => navigate('/students')}>
                Annuler
              </Button>
              <Button color='primary' type='submit'>
                Mettre à jour
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  )
}

export default EditStudent 