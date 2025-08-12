import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  Button,
  Alert
} from 'reactstrap'

const StudentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    setUserRole(role)
    const fetchStudentDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/eleves/getelevebyid/${id}`)
        const eleve = response.data.data
        setStudent({
          id: eleve._id,
          nom: eleve.nom,
          prenom: eleve.prenom,
          dateNaissance: new Date(eleve.dateNaissance).toLocaleDateString(),
          classe: eleve.classe ? `${eleve.classe.niveau} ${eleve.classe.section}` : 'Non assignée',
          adresse: eleve.adresse,
          telephone: eleve.telephone,
          email: eleve.email,
          horlogeId: eleve.horlogeId,
          photo: eleve.photo ? `http://localhost:5000${eleve.photo}` : null,
          parent: eleve.parent ? {
            nom: eleve.parent.nom,
            prenom: eleve.parent.prenom,
            email: eleve.parent.email,
            telephone: eleve.parent.telephone,
            adresse: eleve.parent.adresse
          } : null
        })
      } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'élève:', error)
        setError(error.response?.data?.message || 'Erreur lors de la récupération des détails de l\'élève')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentDetails()
  }, [id])

  if (loading) {
    return <div>Chargement...</div>
  }

  if (error) {
    return (
      <Alert color="danger">
        {error}
      </Alert>
    )
  }

  if (!student) {
    return <div>Élève non trouvé</div>
  }

  return (
    <div>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <CardTitle>Détails de l'Élève</CardTitle>
          <div>
            {userRole === 'admin' && (
              <Button color='primary' className='me-1' onClick={() => navigate(`/edit-student/${id}`)}>
                Modifier
              </Button>
            )}
            <Button color='secondary' onClick={() => navigate('/students')}>
              Retour à la liste
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md='12' className="mb-2 text-center">
              {student.photo ? (
                <img 
                  src={student.photo} 
                  alt={`${student.prenom} ${student.nom}`} 
                  style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  style={{ 
                    width: '150px', 
                    height: '150px', 
                    borderRadius: '50%', 
                    backgroundColor: '#f8f8f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    margin: '0 auto'
                  }}
                >
                  {student.nom[0]}
                </div>
              )}
            </Col>
            <Col md='6'>
              <Card>
                <CardHeader>
                  <CardTitle tag='h6'>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardBody>
                  <ListGroup flush>
                    <ListGroupItem>
                      <strong>Nom:</strong> {student.nom}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Prénom:</strong> {student.prenom}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Date de Naissance:</strong> {student.dateNaissance}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Classe:</strong> {student.classe}
                    </ListGroupItem>
                  </ListGroup>
                </CardBody>
              </Card>
            </Col>
            <Col md='6'>
              <Card>
                <CardHeader>
                  <CardTitle tag='h6'>Coordonnées</CardTitle>
                </CardHeader>
                <CardBody>
                  <ListGroup flush>
                    <ListGroupItem>
                      <strong>Adresse:</strong> {student.adresse}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Téléphone:</strong> {student.telephone}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Email:</strong> {student.email}
                    </ListGroupItem>
                  </ListGroup>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Section Horloge */}
          <Row className='mt-2'>
            <Col md='12'>
              <Card>
                <CardHeader>
                  <CardTitle tag='h6'>État de l'Horloge</CardTitle>
                </CardHeader>
                <CardBody>
                  <ListGroup flush>
                    <ListGroupItem>
                      <strong>Statut:</strong>{' '}
                      {student.horlogeId ? (
                        <span className="text-success">
                          <i className="fas fa-check-circle me-1"></i>
                          Connecté
                        </span>
                      ) : (
                        <span className="text-warning">
                          <i className="fas fa-exclamation-circle me-1"></i>
                          Non connecté (données simulées)
                        </span>
                      )}
                    </ListGroupItem>
                    {student.horlogeId && (
                      <ListGroupItem>
                        <strong>ID de l'horloge:</strong>{' '}
                        <code className="bg-light px-2 py-1 rounded">{student.horlogeId}</code>
                      </ListGroupItem>
                    )}
                    <ListGroupItem>
                      <strong>Type de données:</strong>{' '}
                      {student.horlogeId ? (
                        <span className="text-success">Données réelles</span>
                      ) : (
                        <span className="text-warning">Données simulées</span>
                      )}
                    </ListGroupItem>
                  </ListGroup>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {student.parent && (
            <Row className='mt-2'>
              <Col md='12'>
                <Card>
                  <CardHeader>
                    <CardTitle tag='h6'>Informations du Parent</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <ListGroup flush>
                      <ListGroupItem>
                        <strong>Nom complet:</strong> {student.parent.prenom} {student.parent.nom}
                      </ListGroupItem>
                      <ListGroupItem>
                        <strong>Email:</strong> {student.parent.email}
                      </ListGroupItem>
                      <ListGroupItem>
                        <strong>Téléphone:</strong> {student.parent.telephone}
                      </ListGroupItem>
                      <ListGroupItem>
                        <strong>Adresse:</strong> {student.parent.adresse}
                      </ListGroupItem>
                    </ListGroup>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default StudentDetails 