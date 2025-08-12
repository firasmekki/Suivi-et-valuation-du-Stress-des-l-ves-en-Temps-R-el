import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  Badge
} from 'reactstrap'
import axios from 'axios'

const TeacherDetails = () => {
  const { id } = useParams()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Session expirée')
          return
        }

        console.log('🔄 Début du chargement des données de l\'enseignant:', id)

        // Récupérer les données de l'enseignant avec ses classes
        const teacherResponse = await axios.get(
          `http://localhost:5000/api/enseignants/${id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        console.log('📥 Réponse complète du serveur:', teacherResponse.data)
        
        if (!teacherResponse.data.success) {
          throw new Error(teacherResponse.data.message || 'Erreur lors de la récupération des données')
        }

        const teacherData = teacherResponse.data.data

        // S'assurer que classes est un tableau et contient des IDs valides uniques
        const classIds = Array.isArray(teacherData.classes) 
          ? [...new Set(teacherData.classes.map(classe => typeof classe === 'string' ? classe : classe._id).filter(Boolean))]
          : []

        console.log('🔍 IDs des classes à récupérer (uniques):', classIds)

        // Récupérer les détails complets des classes
        const classesPromises = classIds.map(async (classeId) => {
          try {
            console.log(`📚 Récupération de la classe ${classeId}`)
            const classeResponse = await axios.get(
              `http://localhost:5000/api/classes/${classeId}`,
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            )
            console.log(`✅ Classe ${classeId} récupérée:`, classeResponse.data)
            return classeResponse.data.data
          } catch (error) {
            console.error(`❌ Erreur lors de la récupération de la classe ${classeId}:`, error)
            return null
          }
        })

        const classesDetails = (await Promise.all(classesPromises))
          .filter(Boolean)
          // Éliminer les doublons basés sur l'ID
          .filter((classe, index, self) => 
            index === self.findIndex((c) => c._id === classe._id)
          )

        console.log('📚 Détails des classes récupérés (uniques):', classesDetails)

        setTeacher({
          ...teacherData,
          classes: classesDetails
        })

      } catch (err) {
        console.error('❌ Erreur lors du chargement:', err)
        setError('Erreur lors de la récupération des données')
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherData()
  }, [id])

  const formatSectionName = (section) => {
    if (!section) {
      console.log('⚠️ Section non définie')
      return ''
    }
    
    const sectionMap = {
      'tech': 'Technique',
      'eco': 'Économique',
      'sc': 'Sciences',
      'let': 'Lettres',
      'm': 'Mathématiques',
      'info': 'Informatique',
      'svt': 'Sciences de la Vie et de la Terre'
    }

    // Extraire la base et le numéro de la section
    const [baseSection, number] = section.toLowerCase().trim().split(/\s+/)
    const formattedBase = sectionMap[baseSection] || baseSection
    const result = number ? `${formattedBase} ${number}` : formattedBase
    console.log('🏷️ Formatage section:', { original: section, formatted: result })
    return result
  }

  const formatNiveau = (niveau) => {
    if (!niveau) {
      console.log('⚠️ Niveau non défini')
      return ''
    }
    
    const niveauMap = {
      'bac': 'Bac',
      '3eme': '3ème',
      '2eme': '2ème',
      '1ere': '1ère'
    }
    const result = niveauMap[niveau.toLowerCase()] || niveau
    console.log('🏷️ Formatage niveau:', { original: niveau, formatted: result })
    return result
  }

  const formatClassName = (classe) => {
    if (!classe) {
      console.log('⚠️ Classe non définie')
      return ''
    }
    
    if (!classe.niveau || !classe.section) {
      console.log('⚠️ Données de classe incomplètes:', classe)
      return ''
    }

    const formattedNiveau = formatNiveau(classe.niveau)
    const formattedSection = formatSectionName(classe.section)
    const result = `${formattedNiveau} ${formattedSection}`
    console.log('🏷️ Formatage nom de classe:', { 
      original: classe,
      niveau: formattedNiveau,
      section: formattedSection,
      result 
    })
    return result
  }

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>
  if (!teacher) return <div>Enseignant non trouvé</div>

  // Log des classes avant le rendu
  console.log('📚 Classes disponibles pour le rendu:', teacher.classes)

  return (
    <div>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <CardTitle>Détails de l'Enseignant</CardTitle>
          <div>
            <Link to={`/edit-teacher/${id}`}>
              <Button color='primary' className='me-1'>
                Modifier
              </Button>
            </Link>
            <Link to='/teachers'>
              <Button color='secondary'>
                Retour à la liste
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md='6'>
              <Card>
                <CardHeader>
                  <CardTitle tag='h6'>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardBody>
                  <ListGroup flush>
                    <ListGroupItem>
                      <strong>Nom:</strong> {teacher.nom}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Prénom:</strong> {teacher.prenom}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Date de Naissance:</strong> {new Date(teacher.dateNaissance).toLocaleDateString()}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Email:</strong> {teacher.email}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Téléphone:</strong> {teacher.telephone}
                    </ListGroupItem>
                    <ListGroupItem>
                      <strong>Adresse:</strong> {teacher.adresse}
                    </ListGroupItem>
                  </ListGroup>
                </CardBody>
              </Card>
            </Col>
            <Col md='6'>
              <Card>
                <CardHeader>
                  <CardTitle tag='h6'>Informations Professionnelles</CardTitle>
                </CardHeader>
                <CardBody>
                  <ListGroup flush>
                    <ListGroupItem>
                      <strong>Matière:</strong> {teacher.matiere}
                    </ListGroupItem>
                    <ListGroupItem>
                      <div className="mb-1">
                        <strong>Classes enseignées:</strong>
                      </div>
                      <div>
                        {(!teacher.classes || teacher.classes.length === 0) ? (
                          <div className="text-muted fst-italic">
                            Aucune classe n'est actuellement assignée à cet enseignant
                          </div>
                        ) : (
                          teacher.classes.map((classe) => {
                            if (!classe) return null

                            const uniqueKey = classe._id
                            const className = `${formatNiveau(classe.niveau)} ${formatSectionName(classe.section)}`
                            const nbEleves = Array.isArray(classe.eleves) ? classe.eleves.length : 0
                            
                            // Log pour déboguer
                            console.log('Affichage classe:', {
                              id: classe._id,
                              niveau: classe.niveau,
                              section: classe.section,
                              className,
                              nbEleves
                            })

                            return (
                              <div 
                                key={uniqueKey}
                                className="mb-1"
                              >
                                • {className}
                                <Badge 
                                  color="info" 
                                  className="ms-2"
                                  pill
                                >
                                  {nbEleves} élève{nbEleves > 1 ? 's' : ''}
                                </Badge>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </ListGroupItem>
                  </ListGroup>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </div>
  )
}

export default TeacherDetails 