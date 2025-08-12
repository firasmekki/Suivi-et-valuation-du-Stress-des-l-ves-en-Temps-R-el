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
import { Upload } from 'react-feather'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const AddStudent = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [parentPassword, setParentPassword] = useState('')

  // Fonction pour formater les noms de sections
  const formatSectionName = (section) => {
    const sectionMap = {
      'tech': 'technique',
      'eco': 'économique',
      'sc': 'sciences',
      'let': 'lettres',
      'm': 'mathématiques',
      'info': 'informatique',
      'sn': 'sciences naturelles',
      'se': 'sciences expérimentales',
      'sm': 'sciences mathématiques',
      'si': 'sciences informatiques',
      'st': 'sciences techniques',
      'g': 'gestion',
      'com': 'commerce',
      'spt': 'sport',
      'art': 'arts',
      'svt': 'sciences de la vie et de la terre',
      'pc': 'physique-chimie'
    }
    return sectionMap[section.toLowerCase()] || section
  }

  const [formData, setFormData] = useState({
    // Informations de l'élève
    nom: '',
    prenom: '',
    dateNaissance: '',
    classe: '',
    adresse: '',
    telephone: '',
    email: '',
    horlogeId: '',
    // Photo de profil
    photo: null,
    // Informations du parent
    parentNom: '',
    parentPrenom: '',
    parentEmail: '',
    parentAdresse: '',
    parentTelephone: ''
  })

  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Début du chargement des classes...')
        
        const response = await axios.get('http://localhost:5000/api/classes')
        console.log('Réponse API classes détaillée:', JSON.stringify(response.data.data, null, 2))
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const formattedClasses = response.data.data.map(classe => ({
            _id: classe.id,
            niveau: classe.niveau,
            section: classe.section
          }))
          console.log('Classes formatées:', formattedClasses)
          setClasses(formattedClasses)
        } else {
          console.error('Format de réponse invalide:', response.data)
          setError('Format de réponse invalide pour les classes')
        }
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error)
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
        console.log('Chargement des classes terminé')
      }
    }

    fetchClasses()
  }, [])

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
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('L\'adresse email de l\'élève n\'est pas valide');
        setSubmitting(false);
        return;
      }

      if (!emailRegex.test(formData.parentEmail)) {
        setError('L\'adresse email du parent n\'est pas valide');
        setSubmitting(false);
        return;
      }

      // Validation de la date de naissance (seulement âge minimum)
      const birthDate = new Date(formData.dateNaissance);
      const today = new Date();
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() - 5); // Age minimum 5 ans

      if (birthDate > maxDate) {
        setError('L\'élève doit avoir au moins 5 ans');
        setSubmitting(false);
        return;
      }

      // Validation du numéro de téléphone
      const phoneRegex = /^\d{8}$/;
      if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
        setError('Le numéro de téléphone doit contenir 8 chiffres');
        setSubmitting(false);
        return;
      }

      if (!phoneRegex.test(formData.parentTelephone.replace(/\s/g, ''))) {
        setError('Le numéro de téléphone du parent doit contenir 8 chiffres');
        setSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      
      // Nettoyer et formater les données
      const cleanedData = {
        ...formData,
        telephone: formData.telephone.replace(/\s/g, ''),
        parentTelephone: formData.parentTelephone.replace(/\s/g, ''),
        email: formData.email.trim().toLowerCase(),
        parentEmail: formData.parentEmail.trim().toLowerCase(),
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        parentNom: formData.parentNom.trim(),
        parentPrenom: formData.parentPrenom.trim(),
        adresse: formData.adresse.trim(),
        parentAdresse: formData.parentAdresse.trim()
      };

      // Ajouter les données nettoyées au FormData
      Object.keys(cleanedData).forEach(key => {
        if (key !== 'photo') {
          formDataToSend.append(key, cleanedData[key]);
        }
      });

      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      console.log('Données envoyées après nettoyage:', {
        ...cleanedData,
        photo: formData.photo ? 'File present' : 'No file'
      });

      const response = await axios.post('http://localhost:5000/api/eleves/createeleve', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Si le parent est nouveau, on aura le mot de passe temporaire
        if (response.data.parentPassword) {
          setParentPassword(response.data.parentPassword);
        }
        setSuccessModal(true);
      } else {
        setError(response.data.message || 'Erreur lors de la création de l\'élève');
      }
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data);
      let errorMessage = 'Erreur lors de la création de l\'élève';
      
      if (error.response) {
        if (error.response.status === 400 && error.response.data?.message === 'Un élève avec cet email existe déjà.') {
          errorMessage = 'Un élève avec cet email existe déjà. Veuillez utiliser une autre adresse email.';
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.error || 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        'Erreur lors de la création de l\'élève';
        }
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Réinitialiser l'erreur quand l'utilisateur modifie un champ
    setError(null);
  };

  const handleModalClose = () => {
    setSuccessModal(false);
    navigate('/students');
  };

  return (
    <div className='add-student'>
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Élève</CardTitle>
        </CardHeader>
        <CardBody>
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
                    <Upload size={40} className='text-primary' />
                    <small className='text-muted mt-1'>Photo de profil</small>
                  </div>
                )}
              </div>
              <div className='d-flex flex-column align-items-center'>
                <Input
                  type='file'
                  id='photo'
                  name='photo'
                  onChange={handlePhotoChange}
                  accept='image/*'
                  style={{ display: 'none' }}
                />
                <Label 
                  for='photo' 
                  className='btn btn-primary btn-sm'
                >
                  {preview ? 'Changer la photo' : 'Ajouter une photo'}
                </Label>
                {preview && (
                  <Button
                    color='danger'
                    size='sm'
                    className='mt-1'
                    onClick={() => {
                      setPreview(null)
                      setFormData({
                        ...formData,
                        photo: null
                      })
                    }}
                  >
                    Supprimer la photo
                  </Button>
                )}
              </div>
            </div>

            {/* Informations de l'élève */}
            <Card>
              <CardHeader>
                <CardTitle tag='h4'>Informations de l'élève</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md='6'>
                    <FormGroup>
                      <Label for='nom'>Nom</Label>
                      <Input
                        id='nom'
                        name='nom'
                        value={formData.nom}
                        onChange={handleChange}
                        placeholder='Entrez le nom'
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
                        placeholder='Entrez le prénom'
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md='6'>
                    <FormGroup>
                      <Label for='horlogeId'>ID de l'horloge</Label>
                      <Input
                        id='horlogeId'
                        name='horlogeId'
                        value={formData.horlogeId}
                        onChange={handleChange}
                        placeholder="Entrez l'ID de l'horloge (optionnel)"
                      />
                      <small className='text-muted'>
                        Laissez vide pour utiliser des données simulées, ou entrez l'ID de l'horloge pour des mesures réelles
                      </small>
                    </FormGroup>
                  </Col>
                  <Col md='6'>
                    <FormGroup>
                      <Label for='dateNaissance'>Date de naissance</Label>
                      <Input
                        id='dateNaissance'
                        name='dateNaissance'
                        type='date'
                        value={formData.dateNaissance}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md='6'>
                    <FormGroup>
                      <Label for='classe'>Classe</Label>
                      {loading ? (
                        <div className="d-flex align-items-center mt-1">
                          <Spinner size="sm" color="primary" />
                          <span className="ms-2">Chargement des classes...</span>
                        </div>
                      ) : (
                        <Input
                          type='select'
                          id='classe'
                          name='classe'
                          value={formData.classe}
                          onChange={handleChange}
                          required
                        >
                          <option key="select-default" value="">
                            Sélectionner une classe
                          </option>
                          {classes.map((classe) => (
                            <option key={`classe-${classe._id}`} value={classe._id}>
                              {classe.niveau} {formatSectionName(classe.section)}
                            </option>
                          ))}
                        </Input>
                      )}
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
              </CardBody>
            </Card>

            {/* Informations du parent */}
            <CardTitle tag='h5' className='mb-3 mt-4'>Informations du Parent</CardTitle>
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

            <FormGroup>
              <Label for='parentAdresse'>Adresse du Parent</Label>
              <Input
                type='textarea'
                id='parentAdresse'
                name='parentAdresse'
                value={formData.parentAdresse}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <Row>
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
            </Row>

            <div className='d-flex justify-content-between mt-4'>
              <Button 
                color='secondary' 
                onClick={() => navigate('/students')}
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
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>

      {/* Modal de succès */}
      <Modal isOpen={successModal} toggle={handleModalClose} size="lg">
        <ModalHeader toggle={handleModalClose}>
          <span className="h4 mb-0">Élève créé avec succès</span>
        </ModalHeader>
        <ModalBody>
          <Alert color="success" className="mb-4">
            <div className="alert-body">
              <span className="fw-bold">✓</span> L'élève {formData.prenom} {formData.nom} a été créé avec succès.
            </div>
          </Alert>

          <div className="mt-2 mb-4">
            <h5>Informations de connexion du parent :</h5>
            <p>Un email contenant les informations de connexion a été envoyé à : <strong>{formData.parentEmail}</strong></p>
            
            {parentPassword && (
              <Alert color="info" className="mt-2">
                <div className="alert-heading mb-2">
                  <span className="fw-bold">ℹ️ Information importante</span>
                </div>
                <div className="alert-body">
                  <p className="mb-0">Le mot de passe temporaire du parent est : <strong>{parentPassword}</strong></p>
                  <small className="text-muted">
                    Ce mot de passe a été envoyé par email au parent. Il devra être changé lors de la première connexion.
                  </small>
                </div>
              </Alert>
            )}
          </div>

          <div className="mt-2">
            <h6>Prochaines étapes :</h6>
            <ol className="pl-3">
              <li>Le parent doit vérifier sa boîte email pour recevoir ses identifiants de connexion</li>
              <li>Lors de la première connexion, il devra changer son mot de passe temporaire</li>
              <li>Une fois connecté, il pourra accéder aux informations de son enfant</li>
            </ol>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleModalClose}>
            Retourner à la liste des élèves
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default AddStudent 