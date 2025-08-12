import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Row,
  Col,
  Alert
} from 'reactstrap'
import toast from 'react-hot-toast'

const AddClasse = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    niveau: '',
    section: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('Envoi des données:', formData)
      
      const response = await axios.post('http://localhost:5000/api/classes', {
        niveau: formData.niveau,
        section: formData.section.toLowerCase() // Assurez-vous que la section est en minuscules
      })

      console.log('Réponse du serveur:', response.data)

      if (response.data.success) {
        toast.success('Classe créée avec succès')
        navigate('/classes')
      }
    } catch (err) {
      console.error('Erreur détaillée:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message
      setError(errorMessage)
      toast.error(`Erreur: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une Classe</CardTitle>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert color="danger">
              <div className="alert-body">
                <span>{error}</span>
              </div>
            </Alert>
          )}
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
                    disabled={loading}
                  >
                    <option value=''>Sélectionner un niveau</option>
                    <option value='bac'>Baccalauréat</option>
                    <option value='3eme'>3ème année</option>
                    <option value='2eme'>2ème année</option>
                    <option value='1ere'>1ère année</option>
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
                    disabled={loading}
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
              <Button 
                color='secondary' 
                onClick={() => navigate('/classes')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                color='primary' 
                type='submit'
                disabled={loading}
              >
                {loading ? 'Création en cours...' : 'Créer la classe'}
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </div>
  )
}

export default AddClasse 