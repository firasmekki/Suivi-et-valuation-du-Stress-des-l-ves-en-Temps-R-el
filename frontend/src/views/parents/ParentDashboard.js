import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Alert,
  Spinner,
  Badge,
  Table
} from 'reactstrap'
import { Users, Book, Calendar, MapPin, Phone, Mail, User, Watch, AlertCircle } from 'react-feather'
import './ParentDashboard.scss'

const stressLevels = [
  { label: 'normal', color: 'green', description: 'stable' },
  { label: 'stable', color: 'orange', description: 'stable' },
  { label: 'danger', color: 'red', description: 'danger' }
]

const ParentDashboard = () => {
  const [parentInfo, setParentInfo] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [currentStressIndex, setCurrentStressIndex] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Non authentifié')
          setLoading(false)
          return
        }

        // First get parent profile
        const parentResponse = await axios.get('http://localhost:5000/api/parents/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        setParentInfo(parentResponse.data.data)

        // Then get students using parent ID
        const studentsResponse = await axios.get(`http://localhost:5000/api/parents/${parentResponse.data.data._id}/enfants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        console.log('Données des élèves:', studentsResponse.data)
        console.log('Type de studentsResponse.data:', typeof studentsResponse.data)
        console.log('Est-ce un tableau?', Array.isArray(studentsResponse.data))
        console.log('studentsResponse.data.data:', studentsResponse.data.data)
        
        // S'assurer que students est toujours un tableau
        const studentsData = studentsResponse.data.data || studentsResponse.data || []
        console.log('studentsData final:', studentsData)
        console.log('Type de studentsData:', typeof studentsData)
        console.log('Est-ce un tableau?', Array.isArray(studentsData))
        setStudents(Array.isArray(studentsData) ? studentsData : [])
        setLoading(false)
      } catch (err) {
        console.error('Erreur:', err)
        setError(err.response?.data?.message || 'Erreur lors du chargement des données')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Effet pour faire changer le niveau de stress toutes les 20 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStressIndex(prevIndex => (prevIndex + 1) % stressLevels.length)
    }, 20000) // 20 secondes

    return () => clearInterval(interval) // Nettoyage de l'intervalle
  }, [])

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('fr-FR', options)
  }

  const formatShortDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' }
    return new Date(dateString).toLocaleDateString('fr-FR', options)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner color="primary" />
      </div>
    )
  }

  // S'assurer que students est un tableau
  const studentsArray = Array.isArray(students) ? students : []
  const uniqueClasses = [...new Set(studentsArray.map(student => student.classe))].length

  return (
    <div className="parent-dashboard">
      {/* En-tête avec informations du parent */}
      <Card className="welcome-card">
        <div className="welcome-content">
          <div>
            <h2 className="welcome-message">
              Bienvenue, {parentInfo?.prenom} {parentInfo?.nom}
            </h2>
            <p className="welcome-date">
              <Calendar size={18} />
              {formatDate(new Date())}
            </p>
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <Row className="mb-2">
        <Col md={4}>
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <h3>{studentsArray.length}</h3>
                <p>Enfants</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <Book size={24} />
              </div>
              <div className="stat-info">
                <h3>{uniqueClasses}</h3>
                <p>Classes</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <Calendar size={24} />
              </div>
              <div className="stat-info">
                <h3>{new Date().getFullYear()}</h3>
                <p>Année Scolaire</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Sections côte à côte: Mes Enfants et Niveau de Stress */}
      <Row className="match-height">
        <Col lg="6" md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Mes Enfants</CardTitle>
            </CardHeader>
            <CardBody>
              {error && <Alert color="danger">{error}</Alert>}
              
              <Row>
                {studentsArray.map((student) => (
                  <Col md={6} lg={12} key={student._id} className="mb-2">
                    <Card className="student-card h-100">
                      <div className="student-header">
                        <div className="student-avatar">
                          <User size={24} />
                        </div>
                        <div className="student-info">
                          <h5 className="student-name">
                            {student.prenom} {student.nom}
                          </h5>
                          <span 
                            style={{
                              backgroundColor: '#6610f2', // Couleur mauve du badge
                              color: 'white', // Texte blanc pour contraste
                              padding: '0.25em 0.6em',
                              borderRadius: '0.375rem',
                              fontSize: '0.75em',
                              fontWeight: '700',
                              lineHeight: '1',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              verticalAlign: 'baseline',
                              display: 'inline-block'
                            }}
                          >
                            {student.classe && student.classe.niveau && student.classe.section 
                              ? `${student.classe.niveau} ${student.classe.section}`
                              : student.classe?.nom || 'Non assigné'}
                          </span>
                        </div>
                      </div>
                      <div className="student-details">
                        <div className="detail-item">
                          <Calendar size={18} />
                          Né(e) le {formatShortDate(student.dateNaissance)}
                        </div>
                        <div className="detail-item">
                          <MapPin size={18} />
                          {student.adresse || 'Non renseigné'}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col lg="6" md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Niveau de Stress des Enfants</CardTitle>
            </CardHeader>
            <CardBody>
              {studentsArray.length === 0 ? (
                <Alert color="info">Aucune information de stress disponible car aucun enfant n'est inscrit.</Alert>
              ) : (
                <Row>
                  {studentsArray.map((student) => (
                    <Col md={6} lg={12} key={`stress-${student._id}`} className="mb-2">
                      <Card className="student-card h-100">
                        <div className="student-header">
                          <div className="student-avatar">
                            <Watch size={24} />
                          </div>
                          <div className="student-info">
                            {/* Smartwatch connection status as a title */}
                            <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#28c76f' }}>
                                Votre smartwatch est bien connectée
                            </span>
                          </div>
                        </div>
                        <div className="student-details">
                          {/* Affichage du niveau de stress dynamique */}
                          <div className="detail-item">
                            <AlertCircle size={18} style={{ marginRight: '5px' }} />
                            Stress élève: <span style={{ fontWeight: 'bold', color: stressLevels[currentStressIndex].color }}>
                              {stressLevels[currentStressIndex].label}
                            </span>
                          </div>
                          {/* Barre de couleur dynamique */}
                          <div style={{
                            width: '100%',
                            height: '10px',
                            backgroundColor: stressLevels[currentStressIndex].color,
                            borderRadius: '5px',
                            marginTop: '5px'
                          }}>
                          </div>
                          <div style={{ marginTop: '5px', fontSize: '0.8em', color: '#666' }}>
                            État: {stressLevels[currentStressIndex].description}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ParentDashboard