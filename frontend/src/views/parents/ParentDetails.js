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
  Alert,
  Badge
} from 'reactstrap'

const ParentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [parent, setParent] = useState(null)
  const [enfants, setEnfants] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Session expirée')
          navigate('/login')
          return
        }

        // Récupérer les détails du parent
        const parentResponse = await axios.get(
          `http://localhost:5000/api/parents/${id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        if (!parentResponse.data || !parentResponse.data.data) {
          throw new Error('Aucune donnée reçue du serveur')
        }

        const parentData = parentResponse.data.data
        setParent({
          id: parentData._id,
          nom: parentData.nom || 'Non spécifié',
          prenom: parentData.prenom || 'Non spécifié',
          dateNaissance: parentData.dateNaissance ? new Date(parentData.dateNaissance).toLocaleDateString() : 'Non spécifié',
          adresse: parentData.adresse || 'Non spécifié',
          telephone: parentData.telephone || 'Non spécifié',
          email: parentData.email || 'Non spécifié',
          photo: parentData.photo ? `http://localhost:5000${parentData.photo}` : null
        })

        // Récupérer les enfants du parent
        const enfantsResponse = await axios.get(
          `http://localhost:5000/api/parents/${id}/enfants`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )

        setEnfants(enfantsResponse.data.data || [])
        
      } catch (error) {
        console.error('Détails de l\'erreur:', error)
        if (error.response) {
          console.error('Réponse du serveur:', error.response.data)
          setError(error.response.data.message || 'Erreur lors de la récupération des détails du parent')
        } else if (error.request) {
          console.error('Pas de réponse reçue du serveur')
          setError('Erreur de connexion au serveur')
        } else {
          console.error('Erreur:', error.message)
          setError(error.message || 'Erreur lors de la récupération des détails du parent')
        }
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    } else {
      setError('ID du parent non spécifié')
      setLoading(false)
  }
  }, [id, navigate])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert color="danger">
        {error}
      </Alert>
    )
  }

  if (!parent) {
    return <div>Parent non trouvé</div>
  }

  return (
    <div>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <CardTitle>Détails du Parent</CardTitle>
          <div>
            <Button color='secondary' onClick={() => navigate('/parents')}>
              Retour à la liste
            </Button>
          </div>
        </CardHeader>
        <CardBody>
            <Row>
            <Col md='12' className="mb-2 text-center">
              {parent.photo ? (
                <img 
                  src={parent.photo} 
                  alt={`${parent.prenom} ${parent.nom}`} 
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
                  {parent.nom && parent.nom.length > 0 ? parent.nom[0].toUpperCase() : '?'}
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
                      <strong>Nom:</strong> {parent.nom}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Prénom:</strong> {parent.prenom}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Date de Naissance:</strong> {parent.dateNaissance}
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
                      <strong>Adresse:</strong> {parent.adresse}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Téléphone:</strong> {parent.telephone}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Email:</strong> {parent.email}
                    </ListGroupItem>
                  </ListGroup>
                </CardBody>
              </Card>
              </Col>
            </Row>
          {enfants.length > 0 && (
            <Row className='mt-2'>
              <Col md='12'>
                <Card>
                  <CardHeader>
                    <CardTitle tag='h6'>Liste des Enfants</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <ListGroup flush>
                      {enfants.map((enfant, index) => (
                        <ListGroupItem key={enfant._id || index} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{enfant.prenom} {enfant.nom}</strong>
                          </div>
                          <Badge color={enfant.classe ? "primary" : "warning"}>
                            {enfant.classe ? `${enfant.classe.niveau} ${enfant.classe.section}` : 'Non assigné(e)'}
                          </Badge>
                        </ListGroupItem>
                      ))}
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

export default ParentDetails 