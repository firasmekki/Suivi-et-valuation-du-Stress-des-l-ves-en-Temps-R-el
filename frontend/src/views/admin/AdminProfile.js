import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Button,
  Alert,
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
import { User, Mail, Shield, Key, Calendar, Lock, Settings } from 'react-feather'
import './AdminProfile.scss'
import { useNavigate } from 'react-router-dom'

const AdminProfile = () => {
  const [adminData, setAdminData] = useState(null)
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
    const fetchAdminData = async () => {
      try {
        setError(null)
        const userId = localStorage.getItem('userId')
        const token = localStorage.getItem('token')

        if (!userId || !token) {
          setError('Session expirée. Veuillez vous reconnecter.')
          setLoading(false)
          return
        }

        const response = await axios.get(`http://localhost:5000/api/admin/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data && response.data.data) {
          setAdminData(response.data.data)
        } else {
          setError('Format de données incorrect')
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        if (error.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.')
          setTimeout(() => navigate('/login'), 2000)
        } else if (error.response?.status === 403) {
          setError('Accès refusé. Droits administrateur requis.')
          setTimeout(() => navigate('/error'), 2000)
        } else {
          setError('Erreur lors du chargement des données. Veuillez réessayer.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      
      await axios.post('http://localhost:5000/api/auth/change-password', {
        userId: userId,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      setPasswordSuccess(true)
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
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
    return <Alert color="danger">{error}</Alert>
  }

  return (
    <div className="admin-profile">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-header-avatar">
            <div className="avatar-placeholder">
              {adminData?.nom?.charAt(0) || 'A'}
            </div>
          </div>
          <div className="profile-header-info">
            <h2>{adminData?.nom || 'Administrateur'}</h2>
            <p>Super Administrateur</p>
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
                  <p className="info-value">{adminData?.nom || 'Administrateur'}</p>
                </div>
              </div>
              <div className="info-item">
                <Mail size={20} />
                <div>
                  <p className="info-label">Email</p>
                  <p className="info-value">{adminData?.email || 'admin@example.com'}</p>
                </div>
              </div>
              <div className="info-item">
                <Shield size={20} />
                <div>
                  <p className="info-label">Rôle</p>
                  <p className="info-value">Super Administrateur</p>
                </div>
              </div>
              <div className="info-item">
                <Calendar size={20} />
                <div>
                  <p className="info-label">Date de création du compte</p>
                  <p className="info-value">
                    {adminData?.createdAt 
                      ? new Date(adminData.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC'
                        })
                      : 'Non disponible'
                    }
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md="6" sm="12">
          <Card className="profile-card">
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h4>Sécurité & Paramètres</h4>
              <Button color="primary" className="btn-icon" onClick={() => setShowPasswordModal(true)}>
                <Lock size={14} />
                <span className="ms-1">Changer le mot de passe</span>
              </Button>
            </CardHeader>
            <CardBody>
              <div className="info-item">
                <Key size={20} />
                <div>
                  <p className="info-label">Dernière connexion</p>
                  <p className="info-value">
                    {adminData?.lastLogin 
                      ? new Date(adminData.lastLogin).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Non disponible'
                    }
                  </p>
                </div>
              </div>
              <div className="info-item">
                <Settings size={20} />
                <div>
                  <p className="info-label">Paramètres de sécurité</p>
                  <p className="info-value">Authentification à deux facteurs: Désactivée</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal de changement de mot de passe */}
      <Modal isOpen={showPasswordModal} toggle={() => setShowPasswordModal(!showPasswordModal)}>
        <ModalHeader toggle={() => setShowPasswordModal(!showPasswordModal)}>
          Changer le mot de passe
        </ModalHeader>
        <ModalBody>
          {passwordError && <Alert color="danger">{passwordError}</Alert>}
          {passwordSuccess && (
            <Alert color="success">
              Mot de passe changé avec succès !
            </Alert>
          )}
          <Form onSubmit={handlePasswordChange}>
            <FormGroup>
              <Label for="currentPassword">Mot de passe actuel</Label>
              <Input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="newPassword">Nouveau mot de passe</Label>
              <Input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
              <Progress
                className="mt-1"
                value={calculatePasswordStrength(passwordData.newPassword)}
                color={getPasswordStrengthColor(calculatePasswordStrength(passwordData.newPassword))}
              />
            </FormGroup>
            <FormGroup>
              <Label for="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </FormGroup>
            <Button color="primary" type="submit" block>
              Changer le mot de passe
            </Button>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  )
}

export default AdminProfile 