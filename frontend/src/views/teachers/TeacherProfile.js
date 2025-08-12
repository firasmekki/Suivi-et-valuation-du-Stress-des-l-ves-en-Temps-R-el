import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  FormGroup,
  Label,
  Input,
  Spinner,
  Progress
} from 'reactstrap'
import { User, Mail, Phone, MapPin, Book, Calendar, Lock } from 'react-feather'
import './TeacherProfile.scss'
import { useNavigate } from 'react-router-dom'
import CustomAlert from '../../components/CustomAlert'

const TeacherProfile = () => {
  const [teacherData, setTeacherData] = useState(null)
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
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setError(null)
        const teacherId = localStorage.getItem('userId')
        const token = localStorage.getItem('token')

        if (!teacherId || !token) {
          setError('Session expirée. Veuillez vous reconnecter.')
          setLoading(false)
          return
        }

        const response = await axios.get(`http://localhost:5000/api/enseignants/${teacherId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data && response.data.data) {
          setTeacherData(response.data.data)
        } else {
          setError('Format de données incorrect')
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        if (error.response?.status === 401) {
          navigate('/login')
        } else {
          setError('Erreur lors du chargement des données. Veuillez réessayer.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherData()
  }, [navigate])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    try {
      setPasswordError('')
      const token = localStorage.getItem('token')
      const teacherId = localStorage.getItem('userId')

      await axios.put(
        `http://localhost:5000/api/enseignants/${teacherId}/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      setPasswordSuccess(true)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      // Fermer le modal après 2 secondes
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      if (error.response?.status === 401) {
        setPasswordError('Mot de passe actuel incorrect')
      } else if (error.response?.status === 400) {
        setPasswordError(error.response.data.message || 'Les données fournies sont invalides')
      } else {
        setPasswordError('Erreur lors du changement de mot de passe. Veuillez réessayer.')
      }
    }
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
      <div className="loading-container">
        <Spinner color="primary" />
      </div>
    )
  }

  if (error) {
    return <CustomAlert color="danger">{error}</CustomAlert>
  }

  return (
    <div className="teacher-profile">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-header-avatar">
            <div className="avatar-placeholder">
              {teacherData?.nom?.charAt(0)}
            </div>
          </div>
          <div className="profile-header-info">
            <h2>{teacherData?.nom || 'Chargement...'}</h2>
            <p>Enseignant</p>
          </div>
        </div>
      </div>

      <Row>
        <Col md="6" sm="12">
          <Card className="profile-card">
            <CardHeader>
              <h4>Informations Personnelles</h4>
            </CardHeader>
            <CardBody>
              <div className="info-item">
                <User size={20} />
                <div>
                  <p className="info-label">Nom Complet</p>
                  <p className="info-value">{teacherData?.nom || 'Chargement...'}</p>
                </div>
              </div>
              <div className="info-item">
                <Mail size={20} />
                <div>
                  <p className="info-label">Email</p>
                  <p className="info-value">{teacherData?.email || 'Chargement...'}</p>
                </div>
              </div>
              <div className="info-item">
                <Phone size={20} />
                <div>
                  <p className="info-label">Téléphone</p>
                  <p className="info-value">{teacherData?.telephone || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="info-item">
                <MapPin size={20} />
                <div>
                  <p className="info-label">Adresse</p>
                  <p className="info-value">{teacherData?.adresse || 'Non renseignée'}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md="6" sm="12">
          <Card className="profile-card">
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h4>Informations Professionnelles</h4>
              <Button color="primary" className="btn-icon" onClick={() => setShowPasswordModal(true)}>
                <Lock size={14} />
                <span className="ms-1">Changer le mot de passe</span>
              </Button>
            </CardHeader>
            <CardBody>
              <div className="info-item">
                <Book size={20} />
                <div>
                  <p className="info-label">Matière Enseignée</p>
                  <p className="info-value">{teacherData?.matiere || 'Non renseignée'}</p>
                </div>
              </div>
              <div className="info-item">
                <Calendar size={20} />
                <div>
                  <p className="info-label">Date d'Entrée</p>
                  <p className="info-value">
                    {teacherData?.dateEntree 
                      ? new Date(teacherData.dateEntree).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Non renseignée'
                    }
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Modal isOpen={showPasswordModal} toggle={() => setShowPasswordModal(!showPasswordModal)}>
        <ModalHeader toggle={() => setShowPasswordModal(!showPasswordModal)}>
          Changer le mot de passe
        </ModalHeader>
        <ModalBody>
          {passwordError && <CustomAlert color="danger">{passwordError}</CustomAlert>}
          {passwordSuccess && <CustomAlert color="success">Mot de passe modifié avec succès!</CustomAlert>}
          <Form onSubmit={handlePasswordChange}>
            <FormGroup>
              <Label for="currentPassword">Mot de passe actuel</Label>
              <Input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
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
              />
            </FormGroup>
            <Button color="primary" type="submit" block>
              {loading ? <Spinner size="sm" /> : "Changer le mot de passe"}
            </Button>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  )
}

export default TeacherProfile 