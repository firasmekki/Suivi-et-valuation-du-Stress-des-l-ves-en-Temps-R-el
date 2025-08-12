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
  Alert,
  Row,
  Col
} from 'reactstrap'

const EditParent = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Session expirée')
          navigate('/login')
          return
        }

        const response = await axios.get(`http://localhost:5000/api/parents/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        const parent = response.data
        setFormData({
          nom: parent.nom || '',
          prenom: parent.prenom || '',
          email: parent.email || '',
          telephone: parent.telephone || '',
          adresse: parent.adresse || ''
        })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        setError(error.response?.data?.message || 'Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    fetchParentData()
  }, [id, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `http://localhost:5000/api/parents/${id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setSuccessMessage('Parent mis à jour avec succès')
      setTimeout(() => {
        navigate('/parents')
      }, 2000)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Modifier le Parent</CardTitle>
        </CardHeader>
        <CardBody>
          {error && <Alert color="danger">{error}</Alert>}
          {successMessage && <Alert color="success">{successMessage}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="nom">Nom</Label>
                  <Input
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label for="telephone">Téléphone</Label>
              <Input
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label for="adresse">Adresse</Label>
              <Input
                type="textarea"
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <div className="d-flex justify-content-end gap-2">
              <Button color="secondary" onClick={() => navigate('/parents')}>
                Annuler
              </Button>
              <Button color="primary" type="submit">
                Mettre à jour
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  )
}

export default EditParent 