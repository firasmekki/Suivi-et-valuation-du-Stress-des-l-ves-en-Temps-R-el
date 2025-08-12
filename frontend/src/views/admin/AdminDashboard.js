import React, { useEffect, useState } from 'react'
import { Card, CardBody, Row, Col, CardHeader, CardTitle, Badge, Progress, ListGroup, ListGroupItem, Alert, Button } from 'reactstrap'
import { Users, BookOpen, UserCheck, Book, Calendar, Activity, AlertCircle, TrendingUp, Bell, Clock, BarChart2, RefreshCw } from 'react-feather'
import api from '@src/configs/api'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.scss'

const StatCard = ({ title, value, icon, color }) => (
  <Card className="stats-card">
    <CardBody>
      <div className="stats-info">
        <div>
          <h2 className="stats-title">{value}</h2>
          <p className="stats-subtitle">{title}</p>
        </div>
        <div className={`avatar-stats bg-light-${color}`}>
          <div className="avatar-content">{icon}</div>
        </div>
      </div>
    </CardBody>
  </Card>
)

const AdminDashboard = () => {
  const navigate = useNavigate()
  // LOGS POUR DEBUG
  console.log('RENDER AdminDashboard')
  console.log('AdminDashboard - token:', localStorage.getItem('token'))
  console.log('AdminDashboard - userId:', localStorage.getItem('userId'))
  console.log('AdminDashboard - userRole:', localStorage.getItem('userRole'))

  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    parents: 0,
    classes: 0
  })
  const [stressStats, setStressStats] = useState({ Faible: 0, Modéré: 0, Élevé: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [alerts, setAlerts] = useState([])
  const [classStats, setClassStats] = useState([])
  const [retryCount, setRetryCount] = useState(0)

  // Fonction pour obtenir le message de bienvenue selon l'heure
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  // Fonction pour vérifier la validité du token
  const validateToken = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('❌ Aucun token trouvé')
      return false
    }
    
    try {
      // Vérifier si le token n'est pas expiré (format JWT basique)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('❌ Token expiré')
        return false
      }
      
      console.log('✅ Token valide')
      return true
    } catch (err) {
      console.log('❌ Token invalide:', err.message)
      return false
    }
  }

  // Fonction pour recharger les données
  const reloadData = () => {
    setLoading(true)
    setError(null)
    setRetryCount(prev => prev + 1)
    fetchStats()
  }

  const fetchStats = async () => {
    try {
      // Vérifier l'authentification
      const token = localStorage.getItem('token')
      const userRole = localStorage.getItem('userRole')

      if (!token || !userRole) {
        setError('Session expirée ou non authentifié. Veuillez vous reconnecter.')
        setLoading(false)
        return
      }

      if (userRole !== 'admin') {
        setError('Accès refusé. Seuls les administrateurs peuvent accéder à ce dashboard.')
        setLoading(false)
        return
      }

      // Vérifier la validité du token
      if (!validateToken()) {
        setError('Token invalide ou expiré. Veuillez vous reconnecter.')
        setLoading(false)
        return
      }

      console.log('🔄 Chargement des statistiques...')

      // Appel API avec gestion d'erreur améliorée
      const statsResponse = await api.get('/api/admin/stats')
      console.log('📊 Stats response:', statsResponse.data)
      
      if (statsResponse.data) {
        setStats({
          teachers: statsResponse.data.teachers || 0,
          students: statsResponse.data.students || 0,
          parents: statsResponse.data.parents || 0,
          classes: statsResponse.data.classes || 0
        })
      }

      // Fetch stress stats
      const stressStatsResponse = await api.get('/api/admin/stress-stats')
      console.log('📈 Stress stats response:', stressStatsResponse.data)
      
      if (stressStatsResponse.data) {
        setStressStats(stressStatsResponse.data)
      }

      // Fetch recent activity
      const activityResponse = await api.get('/api/admin/recent-activity')
      console.log('📅 Activity response:', activityResponse.data)
      
      if (activityResponse.data) {
        setRecentActivity(activityResponse.data.map(activity => ({
          title: activity.title,
          time: new Date(activity.timestamp).toLocaleString('fr-FR'),
          type: activity.type
        })))
      }

      // Fetch alerts
      const alertsResponse = await api.get('/api/admin/alerts')
      console.log('🚨 Alerts response:', alertsResponse.data)
      
      if (alertsResponse.data) {
        setAlerts(alertsResponse.data.map(alert => ({
          title: alert.title,
          description: alert.description,
          severity: alert.severity
        })))
      }

      // Fetch class stats
      const classStatsResponse = await api.get('/api/admin/class-stats')
      console.log('📚 Class stats response:', classStatsResponse.data)
      
      if (classStatsResponse.data) {
        setClassStats(classStatsResponse.data.map(stat => ({
          className: stat.name || stat.className,
          studentCount: stat.studentCount,
          averageStress: stat.averageStress,
          status: stat.status
        })))
      }

      console.log('✅ Toutes les données chargées avec succès')

    } catch (err) {
      console.error('=== ERREUR API ===', err, err?.response?.data)
      
      let msg = 'Erreur lors du chargement des statistiques.'
      
      if (err.response?.status === 401) {
        msg = 'Session expirée. Veuillez vous reconnecter.'
        // Rediriger vers login après 2 secondes
        setTimeout(() => navigate('/login'), 2000)
      } else if (err.response?.status === 403) {
        msg = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      } else if (err.message && err.message.includes('Network')) {
        msg = 'Le serveur backend est inaccessible. Vérifiez que le serveur est démarré.'
      }
      
      setError(msg)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats() // Appel initial

    const interval = setInterval(() => {
      fetchStats() // Appel toutes les 30 secondes (au lieu de 10)
    }, 30000) // 30 secondes

    return () => clearInterval(interval) // Nettoyage de l'intervalle
  }, [navigate])

  if (loading) {
    console.log('RENDER AdminDashboard: loading')
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.log('RENDER AdminDashboard: error', error)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="text-center">
          <Alert color="danger" className="mb-3">
            <h4>Erreur de chargement</h4>
            <p>{error}</p>
          </Alert>
          <Button color="primary" onClick={reloadData} disabled={retryCount >= 3}>
            <RefreshCw size={16} className="me-2" />
            Réessayer ({retryCount}/3)
          </Button>
          {retryCount >= 3 && (
            <Button color="secondary" className="ms-2" onClick={() => navigate('/login')}>
              Se reconnecter
            </Button>
          )}
        </div>
      </div>
    )
  }

  console.log('RENDER AdminDashboard: main content')
  return (
    <div className="admin-dashboard">
      {/* En-tête de bienvenue */}
      <Card className="welcome-card">
        <CardBody>
          <div className="welcome-content">
            <div>
              <h2 className="welcome-message">
                {getWelcomeMessage()}, Administrateur
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

      {/* Cartes de statistiques */}
      <Row className="match-height">
        <Col xl='3' md='6'>
          <StatCard
            title='Enseignants'
            value={stats.teachers}
            icon={<Users size={24} />}
            color='primary'
          />
        </Col>
        <Col xl='3' md='6'>
          <StatCard
            title='Élèves'
            value={stats.students}
            icon={<BookOpen size={24} />}
            color='success'
          />
        </Col>
        <Col xl='3' md='6'>
          <StatCard
            title='Parents'
            value={stats.parents}
            icon={<UserCheck size={24} />}
            color='warning'
          />
        </Col>
        <Col xl='3' md='6'>
          <StatCard
            title='Classes'
            value={stats.classes}
            icon={<Book size={24} />}
            color='info'
          />
        </Col>
      </Row>

      {/* Nouvelle section pour les statistiques de stress des élèves */}
      <Row className="match-height mt-3">
        <Col lg='12'>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <CardTitle tag="h4">
                <AlertCircle size={20} className="me-1" />
                Niveau de Stress des Élèves
              </CardTitle>
              <Badge color="light-primary" pill>
                Total: {stressStats.Faible + stressStats.Modéré + stressStats.Élevé} élèves
              </Badge>
            </CardHeader>
            <CardBody>
              <Row className="stress-cards-row">
                <Col md='4'>
                  <Card className="stress-level-card bg-light-success">
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="text-success mb-0">{stressStats.Faible}</h3>
                          <p className="mb-0">Niveau Faible</p>
                        </div>
                        <div className="stress-icon bg-success">
                          <TrendingUp size={24} className="text-white" />
                        </div>
                      </div>
                      <Progress
                        value={(stressStats.Faible / (stressStats.Faible + stressStats.Modéré + stressStats.Élevé)) * 100}
                        color="success"
                        className="mt-2"
                      />
                    </CardBody>
                  </Card>
                </Col>
                <Col md='4'>
                  <Card className="stress-level-card bg-light-warning">
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="text-warning mb-0">{stressStats.Modéré}</h3>
                          <p className="mb-0">Niveau Modéré</p>
                        </div>
                        <div className="stress-icon bg-warning">
                          <AlertCircle size={24} className="text-white" />
                        </div>
                      </div>
                      <Progress
                        value={(stressStats.Modéré / (stressStats.Faible + stressStats.Modéré + stressStats.Élevé)) * 100}
                        color="warning"
                        className="mt-2"
                      />
                    </CardBody>
                  </Card>
                </Col>
                <Col md='4'>
                  <Card className="stress-level-card bg-light-danger">
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="text-danger mb-0">{stressStats.Élevé}</h3>
                          <p className="mb-0">Niveau Élevé</p>
                        </div>
                        <div className="stress-icon bg-danger">
                          <AlertCircle size={24} className="text-white" />
                        </div>
                      </div>
                      <Progress
                        value={(stressStats.Élevé / (stressStats.Faible + stressStats.Modéré + stressStats.Élevé)) * 100}
                        color="danger"
                        className="mt-2"
                      />
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Activité Récente */}
      <Row className="match-height mt-3">
        <Col lg="6">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">
                <Clock size={20} className="me-1" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ListGroup flush>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <ListGroupItem key={index} className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">{activity.title}</h6>
                        <small className="text-muted">{activity.time}</small>
                      </div>
                    </ListGroupItem>
                  ))
                ) : (
                  <ListGroupItem className="text-center text-muted">
                    Aucune activité récente
                  </ListGroupItem>
                )}
              </ListGroup>
            </CardBody>
          </Card>
        </Col>

        {/* Alertes et Notifications */}
        <Col lg="6">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">
                <Bell size={20} className="me-1" />
                Alertes et Notifications
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ListGroup flush>
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <ListGroupItem
                      key={index}
                      className="alert-list-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h6 className="mb-0">{alert.title}</h6>
                      </div>
                      <Badge color={alert.severity === 'attention' ? 'warning' : alert.severity === 'stable' ? 'success' : 'danger'} pill>
                        {alert.severity}
                      </Badge>
                    </ListGroupItem>
                  ))
                ) : (
                  <ListGroupItem className="text-center text-muted">
                    Aucune alerte en cours
                  </ListGroupItem>
                )}
              </ListGroup>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Statistiques par Classe */}
      <Row className="match-height mt-3">
        <Col lg="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">
                <BarChart2 size={20} className="me-1" />
                Statistiques par Classe
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                {classStats.length > 0 ? (
                  classStats.map((stat, index) => (
                    <Col md="4" key={index} className="mb-2">
                      <Card className="class-stat-card">
                        <CardBody>
                          <h5>{stat.className}</h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="mb-0">Élèves: {stat.studentCount}</p>
                              <p className="mb-0">Stress Moyen: {stat.averageStress}</p>
                            </div>
                            <Badge color={stat.status === 'stable' ? 'success' : 'warning'} pill>
                              {stat.status}
                            </Badge>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Col lg="12">
                    <div className="text-center text-muted">
                      Aucune statistique de classe disponible
                    </div>
                  </Col>
                )}
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboard 