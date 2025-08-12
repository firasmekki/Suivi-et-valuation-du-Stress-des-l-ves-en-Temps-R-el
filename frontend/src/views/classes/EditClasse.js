import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Badge
} from 'reactstrap'
import axios from 'axios'
import './EditClasse.scss'

const EditClasse = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    niveau: '',
    section: ''
  })

  // Create axios config with auth header
  const getAxiosConfig = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.')
      window.location.href = '/login'
      return null
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  }

  useEffect(() => {
    const fetchClasse = async () => {
      try {
        const config = getAxiosConfig()
        if (!config) return

        // Récupérer les informations de la classe
        const classeResponse = await axios.get(
          `http://localhost:5000/api/classes/${id}`,
          config
        )

        if (classeResponse.data.success) {
          setFormData({
            niveau: classeResponse.data.data.niveau,
            section: classeResponse.data.data.section
          })
        }

        setLoading(false)
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
        setError(err.response?.data?.message || 'Erreur lors du chargement')
        setLoading(false)
      }
    }

    fetchClasse()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const config = getAxiosConfig()
      if (!config) return

      if (!id || id === 'undefined') {
        setError('ID de classe non valide')
        return
      }

      const response = await axios.put(
        `http://localhost:5000/api/classes/${id}`,
        formData,
        config
      )
      
      if (response.data.success) {
        navigate('/classes')
      } else {
        setError('Erreur lors de la mise à jour de la classe')
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err)
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className="text-center my-3">
        <Spinner color="primary" />
      </div>
    )
  }

  return (
    <div className="edit-classe">
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Modifier la Classe</CardTitle>
        </CardHeader>
        <CardBody>
          {error && <Alert color="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label for='niveau'>Niveau</Label>
                  <Input
                    type='select'
                    id='niveau'
                    name='niveau'
                    value={formData.niveau}
                    onChange={handleChange}
                    required
                  >
                    <option value=''>Sélectionner un niveau</option>
                    <option value='1ere'>1ère année</option>
                    <option value='2eme'>2ème année</option>
                    <option value='3eme'>3ème année</option>
                    <option value='bac'>Bac</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='section'>Section</Label>
                  <Input
                    type='select'
                    id='section'
                    name='section'
                    value={formData.section}
                    onChange={handleChange}
                    required
                  >
                    <option value=''>Sélectionner une section</option>
                    <option value='svt'>SVT</option>
                    <option value='eco'>Économie et Gestion</option>
                    <option value='math'>Mathématiques</option>
                    <option value='info'>Informatique</option>
                    <option value='tech'>Technique</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <div className='d-flex justify-content-between mt-4'>
              <Button color='secondary' onClick={() => navigate('/classes')}>
                Annuler
              </Button>
              <Button color='primary' type='submit'>
                Enregistrer les modifications
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  )
}

export default EditClasse 