import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Badge,
  Spinner,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Progress
} from 'reactstrap'
import { Users, BookOpen, Key, Calendar, TrendingUp, Award, Lock, ChevronDown, ChevronUp } from 'react-feather'
import './TeacherDashboard.scss'
import CustomAlert from '../../components/CustomAlert'

// Fonction utilitaire pour générer des clés uniques
const generateUniqueKey = (prefix, id, field) => {
  return `${prefix}-${id}-${field}-${Date.now()}`
}

const TeacherDashboard = () => {
  // LOGS POUR DEBUG
  console.log('TeacherDashboard - token:', localStorage.getItem('token'))
  console.log('TeacherDashboard - userId:', localStorage.getItem('userId'))
  console.log('TeacherDashboard - userRole:', localStorage.getItem('userRole'))

  const alertRef = useRef(null)
  const [teacherData, setTeacherData] = useState({
    classes: [],
    totalStudents: 0,
    name: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(localStorage.getItem('passwordChanged') === 'true')
  const [expandedClasses, setExpandedClasses] = useState({})

  // Fonction pour basculer l'affichage des élèves d'une classe
  const toggleClassExpansion = (classId) => {
    setExpandedClasses(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }))
  }

  // Fonction pour formater les données de classe avec des identifiants uniques
  const formatClassData = useCallback((classes) => {
    // Créer une Map pour dédupliquer les classes par ID
    const classesMap = new Map();

    // Traiter chaque classe
    classes.forEach(classe => {
      if (classe && classe._id) {
        const classeId = classe._id.toString();
        const eleveCount = Array.isArray(classe.eleves) ? classe.eleves.length : 0;

        // Ne garder que les classes avec des élèves
        if (eleveCount > 0) {
          classesMap.set(classeId, {
            ...classe,
            displayId: `${classeId}-${Date.now()}`,
            students: {
              count: eleveCount,
              list: classe.eleves || []
            },
            academicYear: '2023-2024'
          });
        }
      }
    });

    // Convertir la Map en tableau
    return Array.from(classesMap.values());
  }, [])

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setError(null)
        const teacherId = localStorage.getItem('userId')
        const token = localStorage.getItem('token')

        if (!teacherId || !token) {
          setError('Session expirée ou non authentifié. Veuillez vous reconnecter.')
          setLoading(false)
          return
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }

        const [teacherResponse, classesResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/enseignants/${teacherId}`, config),
          axios.get(`http://localhost:5000/api/enseignants/${teacherId}/classes`, config)
        ])

        const teacher = teacherResponse.data.data
        const classes = classesResponse.data.data || []
        const formattedClasses = formatClassData(classes)

        setTeacherData({
          name: `${teacher.prenom} ${teacher.nom}`,
          classes: formattedClasses,
          totalStudents: formattedClasses.reduce((total, classe) => total + classe.students.count, 0)
        })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error, error?.response?.data)
        let msg = 'Erreur lors du chargement des données.'
        if (error.response?.data?.message) msg = error.response.data.message
        else if (error.message && error.message.includes('Network')) msg = 'Le serveur backend est inaccessible.'
        setError(msg)
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherData()
  }, [formatClassData])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    // Validation du mot de passe
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Tous les champs sont obligatoires')
      return
    }

    // Vérification de la longueur minimale
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    // Vérification de la correspondance des mots de passe
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    // Vérification que le nouveau mot de passe est différent de l'ancien
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien')
      return
    }

    try {
      const userId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      const response = await axios.post(
        'http://localhost:5000/api/auth/change-password',
        {
          userId,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.success) {
        localStorage.setItem('passwordChanged', 'true')
        setPasswordChanged(true)
        setPasswordSuccess(true)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setTimeout(() => {
          setShowPasswordModal(false)
          setPasswordSuccess(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      if (error.response?.status === 401) {
        setPasswordError('Mot de passe actuel incorrect')
      } else if (error.response?.status === 400) {
        setPasswordError(error.response.data.message || 'Les données fournies sont invalides')
      } else {
        setPasswordError('Une erreur est survenue lors du changement de mot de passe')
      }
    }
  }

  // Fonction pour obtenir le message de bienvenue selon l'heure
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  // Fonction pour obtenir le nom complet de la section
  const getFullSectionName = (shortSection) => {
    const baseSection = shortSection.split(' ')[0].toLowerCase()
    const number = shortSection.split(' ')[1] || ''

    const sectionNames = {
      'tech': 'Technique',
      'eco': 'Économie et Gestion',
      'math': 'Mathématiques',
      'svt': 'Sciences de la Vie et de la Terre',
      'info': 'Informatique'
    }

    const fullName = sectionNames[baseSection] || baseSection
    return number ? `${fullName} ${number}` : fullName
  }

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.match(/[a-z]+/)) strength += 25
    if (password.match(/[A-Z]+/)) strength += 25
    if (password.match(/[0-9]+/)) strength += 25
    return strength
  }

  const getPasswordStrengthColor = (strength) => {
    if (strength <= 25) return 'danger'
    if (strength <= 50) return 'warning'
    if (strength <= 75) return 'info'
    return 'success'
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner color="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{color: 'red', fontWeight: 'bold', padding: 20, fontSize: 18}}>
          {error}
      </div>
    )
  }

  return (
    <div className="teacher-dashboard">
      {/* Alerte de changement de mot de passe */}
      {!passwordChanged && (
        <CustomAlert color="danger" className="password-alert mb-4">
          <div className="alert-content">
            <div className="alert-icon">
              <Key size={24} className="text-danger" />
            </div>
            <div className="alert-text">
              <h4 className="alert-title text-danger">
                Changement de mot de passe requis
              </h4>
              <p className="alert-message">
                Pour des raisons de sécurité, veuillez changer votre mot de passe temporaire.
              </p>
              <Button color="danger" outline onClick={() => setShowPasswordModal(true)}>
                Changer le mot de passe
              </Button>
            </div>
          </div>
        </CustomAlert>
      )}

      {passwordSuccess && (
        <div ref={alertRef}>
          <CustomAlert color="success" className="mb-4">
            Mot de passe modifié avec succès !
          </CustomAlert>
        </div>
      )}

      {/* En-tête de bienvenue */}
      <Card className="welcome-card">
        <CardBody>
          <div className="welcome-content">
            <div>
              <h2 className="welcome-message">
                {getWelcomeMessage()}, {teacherData.name || 'Professeur'}
              </h2>
              <p className="welcome-date">
                <Calendar size={14} className="me-1" />
                {new Date().toLocaleString('fr-FR', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).replace(/^\w/, c => c.toUpperCase())}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Statistiques */}
      <Row className="match-height mb-4">
        <Col xl="6" md="6">
          <Card className="statistic-card">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="avatar-stats bg-light-primary">
                  <Users size={24} className="text-primary" />
                </div>
                <div className="ms-2">
                  <h5 className="mb-0">{teacherData.totalStudents}</h5>
                  <small>Élèves au total</small>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl="6" md="6">
          <Card className="statistic-card">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="avatar-stats bg-light-info">
                  <BookOpen size={24} className="text-info" />
                </div>
                <div className="ms-2">
                  <h5 className="mb-0">{teacherData.classes.length}</h5>
                  <small>Classes</small>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Liste des classes */}
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <CardTitle tag="h4">Mes Classes</CardTitle>
            <p className="text-muted mb-0">Gérez vos classes et accédez aux détails</p>
          </div>
          {teacherData.classes.length > 0 && (
            <div className="d-flex align-items-center">
              <TrendingUp size={16} className="text-success me-1" />
              <span className="fw-bolder">{teacherData.classes.length} classes actives</span>
            </div>
          )}
        </CardHeader>
        <CardBody>
          {teacherData.classes.length === 0 ? (
            <CustomAlert color="info" className="mb-0">
              <div className="alert-body d-flex align-items-center">
                <BookOpen size={20} className="me-2" />
                <span>Vous n'avez pas encore de classes assignées.</span>
              </div>
            </CustomAlert>
          ) : (
            <div className="classes-grid">
              {teacherData.classes.map((classe) => (
                <Card key={classe.displayId} className="class-card">
                  <CardBody>
                    <div className="class-header d-flex justify-content-between align-items-center">
                      <div>
                        <h4 className="class-title">{classe.niveau}</h4>
                        <Badge color="light-primary" pill>
                          {classe.students.count} élèves
                        </Badge>
                      </div>
                      <Button
                        color="flat-primary"
                        size="sm"
                        onClick={() => toggleClassExpansion(classe.displayId)}
                      >
                        {expandedClasses[classe.displayId] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </Button>
                    </div>
                    <p className="class-section">{getFullSectionName(classe.section)}</p>
                    <div className="class-stats">
                      <div className="stat">
                        <Users size={16} />
                        <span>Élèves actifs</span>
                        <h5>{classe.students.count}</h5>
                      </div>
                      <div className="stat">
                        <Calendar size={16} />
                        <span>Année scolaire</span>
                        <h5>{classe.academicYear}</h5>
                      </div>
                    </div>

                    {/* Liste des élèves */}
                    {expandedClasses[classe.displayId] && (
                      <div className="students-list mt-2">
                        <h6 className="mb-2">Liste des élèves</h6>
                        {classe.students.list.length > 0 ? (
                          <div className="student-grid">
                            {classe.students.list.map((student, index) => (
                              <div key={student._id || index} className="student-item p-1">
                                <Users size={14} className="me-1" />
                                {student.prenom} {student.nom}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted mb-0">Aucun élève dans cette classe</p>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de changement de mot de passe */}
      <Modal isOpen={showPasswordModal} toggle={() => setShowPasswordModal(!showPasswordModal)} className="modal-dialog-centered">
        <Form onSubmit={handlePasswordChange}>
          <ModalHeader toggle={() => setShowPasswordModal(!showPasswordModal)}>
            <div className="d-flex align-items-center">
              <Lock size={18} className="me-2" />
              Changer le mot de passe
            </div>
          </ModalHeader>
          <ModalBody>
            {passwordError && (
              <CustomAlert color="danger" className="mb-3">
                <div className="d-flex align-items-center">
                  <Key size={18} className="me-2" />
                  {passwordError}
                </div>
              </CustomAlert>
            )}
            <FormGroup>
              <Label for="currentPassword">Mot de passe actuel</Label>
              <Input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
                placeholder="Entrez votre mot de passe actuel"
                className="form-control-lg"
              />
            </FormGroup>
            <FormGroup>
              <Label for="newPassword">Nouveau mot de passe</Label>
              <Input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                placeholder="Minimum 8 caractères"
                className="form-control-lg"
              />
              <div className="mt-1">
                <small className="text-muted">Force du mot de passe:</small>
                <Progress
                  value={calculatePasswordStrength(passwordData.newPassword)}
                  color={getPasswordStrengthColor(calculatePasswordStrength(passwordData.newPassword))}
                  className="mt-1"
                />
              </div>
              <small className="text-muted d-block mt-1">
                Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre
              </small>
            </FormGroup>
            <FormGroup>
              <Label for="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                placeholder="Retapez le nouveau mot de passe"
                className="form-control-lg"
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => {
              setShowPasswordModal(false)
              setPasswordError('')
              setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              })
            }}>
              Annuler
            </Button>
            <Button color="primary" type="submit">
              Changer le mot de passe
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  )
}

export default TeacherDashboard 
 