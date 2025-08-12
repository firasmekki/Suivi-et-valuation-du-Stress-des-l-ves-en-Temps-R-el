import React, { useEffect } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button } from 'reactstrap'
import { Link, useNavigate } from 'react-router-dom'
import { Users, BookOpen, FileText, Settings } from 'react-feather'

const Home = () => {
  const userRole = localStorage.getItem('userRole')
  const userName = localStorage.getItem('userName') || 'Utilisateur'
  const navigate = useNavigate()

  useEffect(() => {
    if (userRole === 'parent') {
      navigate('/parent-dashboard', { replace: true })
    }
  }, [userRole, navigate])

  console.log('RENDER Home component - userRole:', userRole)

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const getDashboardRoute = () => {
    switch (userRole) {
      case 'admin':
        return '/admin-dashboard'
      case 'enseignant':
        return '/teacher-dashboard'
      case 'parent':
        return '/parent-dashboard'
      default:
        return '/login'
    }
  }

  return (
    <div className="home-page">
      <Card className="welcome-card mb-4">
        <CardBody>
          <div className="text-center">
            <h2 className="mb-2">
              {getWelcomeMessage()}, {userName} !
            </h2>
            <p className="text-muted">
              Bienvenue dans votre espace de gestion scolaire
            </p>
            <p className="mb-0">
              <strong>Rôle :</strong> {userRole}
            </p>
          </div>
        </CardBody>
      </Card>

      <Row>
        <Col lg="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Navigation Rapide</CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                {userRole === 'admin' && (
                  <>
                    <Col md="3" className="mb-3">
                      <Link to="/admin-dashboard" className="text-decoration-none">
                        <Card className="text-center h-100">
                          <CardBody>
                            <Settings size={48} className="text-primary mb-2" />
                            <h5>Dashboard Admin</h5>
                            <p className="text-muted">Gestion générale</p>
                          </CardBody>
                        </Card>
                      </Link>
                    </Col>
                    <Col md="3" className="mb-3">
                      <Link to="/classes" className="text-decoration-none">
                        <Card className="text-center h-100">
                          <CardBody>
                            <BookOpen size={48} className="text-success mb-2" />
                            <h5>Classes</h5>
                            <p className="text-muted">Gestion des classes</p>
                          </CardBody>
                        </Card>
                      </Link>
                    </Col>
                    <Col md="3" className="mb-3">
                      <Link to="/students" className="text-decoration-none">
                        <Card className="text-center h-100">
                          <CardBody>
                            <Users size={48} className="text-warning mb-2" />
                            <h5>Élèves</h5>
                            <p className="text-muted">Gestion des élèves</p>
                          </CardBody>
                        </Card>
                      </Link>
                    </Col>
                    <Col md="3" className="mb-3">
                      <Link to="/notes" className="text-decoration-none">
                        <Card className="text-center h-100">
                          <CardBody>
                            <FileText size={48} className="text-info mb-2" />
                            <h5>Notes</h5>
                            <p className="text-muted">Gestion des notes</p>
                          </CardBody>
                        </Card>
                      </Link>
                    </Col>
                  </>
                )}

                {userRole === 'enseignant' && (
                  <>
                    <Col md="4" className="mb-3">
                      <Link to="/teacher-dashboard" className="text-decoration-none">
                        <Card className="text-center h-100">
                          <CardBody>
                            <Settings size={48} className="text-primary mb-2" />
                            <h5>Dashboard Enseignant</h5>
                            <p className="text-muted">Vue d'ensemble</p>
                          </CardBody>
                        </Card>
                      </Link>
                    </Col>
                    <Col md="4" className="mb-3">
                      <Link to="/classes" className="text-decoration-none">
                        <Card className="text-center h-100">
                          <CardBody>
                            <BookOpen size={48} className="text-success mb-2" />
                            <h5>Mes Classes</h5>
                            <p className="text-muted">Classes assignées</p>
                          </CardBody>
                        </Card>
                      </Link>
                    </Col>
                    <Col md="4" className="mb-3">
                      <Link to="/notes" className="text-decoration-none">
                        <Card className="text-center h-100">
                          <CardBody>
                            <FileText size={48} className="text-info mb-2" />
                            <h5>Notes</h5>
                            <p className="text-muted">Gestion des notes</p>
                          </CardBody>
                        </Card>
                      </Link>
                    </Col>
                  </>
                )}

                {userRole === 'parent' && (
                  <Col md="12">
                    <Link to="/parent-dashboard" className="text-decoration-none">
                      <Card className="text-center">
                        <CardBody>
                          <Users size={48} className="text-primary mb-2" />
                          <h5>Dashboard Parent</h5>
                          <p className="text-muted">Suivi de votre enfant</p>
                        </CardBody>
                      </Card>
                    </Link>
                  </Col>
                )}
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col lg="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Informations Système</CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md="6">
                  <h6>État de l'authentification</h6>
                  <ul className="list-unstyled">
                    <li><strong>Token :</strong> {localStorage.getItem('token') ? '✅ Présent' : '❌ Absent'}</li>
                    <li><strong>Rôle :</strong> {userRole || 'Non défini'}</li>
                    <li><strong>Nom :</strong> {userName}</li>
                  </ul>
                </Col>
                <Col md="6">
                  <h6>Actions</h6>
                  <div className="d-flex gap-2">
                    <Button 
                      color="primary" 
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Recharger la page
                    </Button>
                    <Button 
                      color="secondary" 
                      size="sm"
                      onClick={() => {
                        localStorage.clear()
                        window.location.href = '/login'
                      }}
                    >
                      Se déconnecter
                    </Button>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home
