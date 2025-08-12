// ** React Imports
import { useSkin } from '@hooks/useSkin'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../redux/reducers/auth'

// ** API Import
import api from '@src/configs/api'

// ** Custom Components
import InputPasswordToggle from '@components/input-password-toggle'

// ** Reactstrap Imports
import { Row, Col, CardTitle, CardText, Form, Label, Input, Button } from 'reactstrap'

// ** Illustrations Imports
import illustrationsLight from '@src/assets/images/pages/login-v2.svg'
import illustrationsDark from '@src/assets/images/pages/login-v2-dark.svg'

// ** Styles
import '@styles/react/pages/page-authentication.scss'

const Login = () => {
  const { skin } = useSkin()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const source = skin === 'dark' ? illustrationsDark : illustrationsLight

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userRole = localStorage.getItem('userRole')
    
    if (token && userRole) {
      const redirectPath = userRole === 'admin' 
        ? '/admin-dashboard'
        : userRole === 'enseignant'
        ? '/teacher-dashboard'
        : '/home'
      navigate(redirectPath)
    }
  }, [navigate])

  // Gérer les changements de champs
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogin = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (isLoading) return
    
    setIsLoading(true)
    setError('')

    try {
      // Préparer les données de connexion
      const loginData = {
        email: formData.email.trim(),
        password: formData.password
      }

      // Tentative de connexion
      const response = await api.post('/api/auth/login', loginData)

      if (!response.data || !response.data.token) {
        throw new Error('Réponse invalide du serveur')
      }

      // Nettoyer le localStorage et stocker les nouvelles données
      localStorage.clear()
      
      // Stocker les données d'authentification
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('userId', user.id)
      localStorage.setItem('userRole', user.role)
      localStorage.setItem('userName', `${user.prenom} ${user.nom}`)
      localStorage.setItem('userMatiere', user.matiere)

      // Mettre à jour le store Redux
      dispatch(loginSuccess({ token, user }))

      // Forcer une mise à jour de l'état d'authentification
      window.dispatchEvent(new Event('storage'))

      // Déterminer la redirection
      const redirectPath = user.role === 'admin' 
        ? '/admin-dashboard'
        : user.role === 'enseignant'
        ? '/teacher-dashboard'
        : '/home'

      // Rediriger avec un délai pour permettre la mise à jour de l'état
      setTimeout(() => {
        navigate(redirectPath, { replace: true })
      }, 500)
      
    } catch (error) {
      console.error('=== ERREUR DE CONNEXION ===', error)
      
      if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else if (error.response?.status === 401) {
        setError('Email ou mot de passe incorrect')
      } else if (error.response?.status === 404) {
        setError('Utilisateur non trouvé')
      } else {
        setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Validation du formulaire
  const isFormValid = formData.email && formData.password

  return (
    <div className='auth-wrapper auth-cover'>
      <Row className='auth-inner m-0'>
        <Col className='d-none d-lg-flex align-items-center p-5' lg='8' sm='12'>
          <div className='w-100 d-lg-flex align-items-center justify-content-center px-5'>
            <img className='img-fluid' src={source} alt='Login Cover' />
          </div>
        </Col>
        <Col className='d-flex align-items-center auth-bg px-2 p-lg-5' lg='4' sm='12'>
          <Col className='px-xl-2 mx-auto' sm='8' md='6' lg='12'>
            <CardTitle tag='h2' className='fw-bold mb-1'>
              Bienvenue! 👋
            </CardTitle>
            <CardText className='mb-2'>Connectez-vous à votre compte</CardText>
            {error && <div className='alert alert-danger'>{error}</div>}
            <Form className='auth-login-form mt-2' onSubmit={handleLogin} noValidate>
              <div className='mb-1'>
                <Label className='form-label' for='login-email'>
                  Email
                </Label>
                <Input
                  type='email'
                  id='login-email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder='exemple@email.com'
                  autoFocus
                />
              </div>
              <div className='mb-1'>
                <div className='d-flex justify-content-between'>
                  <Label className='form-label' for='login-password'>
                    Mot de passe
                  </Label>
                  <Link to='/forgot-password'>
                    <small>Mot de passe oublié?</small>
                  </Link>
                </div>
                <Input
                  type='password'
                  id='login-password'
                  name='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  className='input-group-merge'
                />
              </div>
              <Button 
                type='submit'
                color='primary' 
                block 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Form>
          </Col>
        </Col>
      </Row>
    </div>
  )
}

export default Login
