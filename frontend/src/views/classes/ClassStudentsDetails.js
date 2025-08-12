import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Alert,
  Spinner,
  Button,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  CardText,
  Progress
} from 'reactstrap'
import { User, Calendar, MapPin, AlertCircle, BarChart2, TrendingUp, Watch, Activity, Thermometer, Heart } from 'react-feather'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  ArcElement
} from 'chart.js'
import './ClassStudentsDetails.scss'
import { predictStressLevel } from '../../utils/stressPrediction'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  ArcElement
)

const stressLevels = [
  { label: 'Faible', color: 'success', description: 'stable' },
  { label: 'Modéré', color: 'warning', description: 'légèrement élevé' },
  { label: 'Élevé', color: 'danger', description: 'critique' }
]

const generateFakeHistory = () => {
  const history = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const randomStressLevel = stressLevels[Math.floor(Math.random() * stressLevels.length)]
    history.push({
      date: date.toISOString().split('T')[0],
      stress: randomStressLevel.label,
      color: randomStressLevel.color
    })
  }
  return history.reverse()
}

// Fonction pour récupérer les données des capteurs
const fetchSensorData = async (studentId) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Non authentifié')
    }

    // Appel à l'API backend qui communique avec InfluxDB
    const response = await axios.get(`http://localhost:5000/api/sensors/${studentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (response.data && response.data.data) {
      return {
        skinPulse: response.data.data.skinPulse,
        heartRate: response.data.data.heartRate,
        temperature: response.data.data.temperature,
        timestamp: response.data.data.timestamp,
        isSimulated: false
      }
    } else {
      console.warn('Aucune donnée trouvée, utilisation des données simulées')
      return generateSensorData(studentId)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données des capteurs:', error)
    return generateSensorData(studentId)
  }
}

// Fonction pour générer des données de capteurs simulées (fallback)
const generateSensorData = (studentId) => {
  const timeFactor = (new Date().getSeconds() % 30) / 30
  
  const baseValues = {
    skinPulse: 65 + (timeFactor * 15),
    heartRate: 70 + (timeFactor * 20),
    temperature: 36.6 + (timeFactor * 0.4)
  }

  const randomVariation = (base, maxVariation) => {
    return base + (Math.random() * maxVariation * 2 - maxVariation)
  }

  return {
    skinPulse: Math.round(randomVariation(baseValues.skinPulse, 2)),
    heartRate: Math.round(randomVariation(baseValues.heartRate, 3)),
    temperature: parseFloat(randomVariation(baseValues.temperature, 0.1).toFixed(1)),
    timestamp: new Date().toISOString(),
    isSimulated: true
  }
}

// Fonction pour calculer les pourcentages basés sur les valeurs réelles
const calculatePercentages = (sensorData) => {
  if (!sensorData) return null

  // Plages de valeurs normales
  const ranges = {
    skinPulse: { min: 60, max: 100 },
    heartRate: { min: 60, max: 120 },
    temperature: { min: 36.5, max: 37.5 }
  }

  // Calcul des pourcentages
  const percentages = {
    skinPulse: Math.min(100, Math.max(0, ((sensorData.skinPulse - ranges.skinPulse.min) / (ranges.skinPulse.max - ranges.skinPulse.min)) * 100)),
    heartRate: Math.min(100, Math.max(0, ((sensorData.heartRate - ranges.heartRate.min) / (ranges.heartRate.max - ranges.heartRate.min)) * 100)),
    temperature: Math.min(100, Math.max(0, ((sensorData.temperature - ranges.temperature.min) / (ranges.temperature.max - ranges.temperature.min)) * 100))
  }

  // Calcul du niveau de stress basé sur les valeurs des capteurs
  const stressLevel = (percentages.skinPulse + percentages.heartRate + percentages.temperature) / 3
  percentages.stress = stressLevel

  // Déterminer le niveau de stress basé sur le pourcentage
  let stressLabel = 'Faible'
  let stressColor = 'success'
  if (stressLevel > 70) {
    stressLabel = 'Élevé'
    stressColor = 'danger'
  } else if (stressLevel > 30) {
    stressLabel = 'Modéré'
    stressColor = 'warning'
  }

  return {
    ...percentages,
    stressLabel,
    stressColor
  }
}

const ClassStudentsDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [classeInfo, setClasseInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showSensorModal, setShowSensorModal] = useState(false)
  const [selectedStudentHistory, setSelectedStudentHistory] = useState(null)
  const [selectedStudentSensors, setSelectedStudentSensors] = useState(null)
  const [sensorData, setSensorData] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRealData, setIsRealData] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [predictionData, setPredictionData] = useState(null)

  const toggleHistoryModal = () => setShowHistoryModal(!showHistoryModal)
  const toggleSensorModal = () => setShowSensorModal(!showSensorModal)

  // Fonction pour générer l'historique des données avec tendance à la hausse
  const generateSensorHistory = () => {
    const history = []
    const now = new Date()
    const baseSkinPulse = 65
    const baseHeartRate = 70
    const baseTemperature = 36.6
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now)
      time.setHours(now.getHours() - (23 - i))
      
      // Facteur de progression qui augmente avec le temps
      const progressFactor = i / 23 // De 0 à 1
      
      // Ajout d'une petite variation aléatoire pour rendre le graphique plus naturel
      const randomVariation = (Math.random() - 0.5) * 5
      
      history.push({
        time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        skinPulse: Math.floor(baseSkinPulse + (progressFactor * 25) + randomVariation),
        heartRate: Math.floor(baseHeartRate + (progressFactor * 40) + randomVariation),
        temperature: (baseTemperature + (progressFactor * 0.7) + (randomVariation * 0.1)).toFixed(1)
      })
    }
    return history
  }

  // Mise à jour des données en temps réel
  useEffect(() => {
    if (showSensorModal && selectedStudentSensors) {
      const fetchData = async () => {
        try {
          setConnectionError(null)
          const data = await fetchSensorData(selectedStudentSensors._id)
          if (data) {
            const percentages = calculatePercentages(data)
            setSensorData({ ...data, percentages })
            setLastUpdate(new Date())
            setIsRealData(!data.isSimulated)
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données:', error)
          setConnectionError('Erreur de connexion aux capteurs')
          setError('Erreur lors de la récupération des données des capteurs')
        } finally {
          setLoading(false)
        }
      }

      fetchData()
      const interval = setInterval(fetchData, 2000)
      return () => clearInterval(interval)
    }
  }, [showSensorModal, selectedStudentSensors])

  useEffect(() => {
    const fetchClassStudents = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Non authentifié')
          setLoading(false)
          return
        }

        const classeResponse = await axios.get(`http://localhost:5000/api/classes/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        setClasseInfo(classeResponse.data.data)

        const studentsResponse = await axios.get(`http://localhost:5000/api/classes/${id}/eleves`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        // Récupérer les données des capteurs pour chaque élève
        const studentsWithData = await Promise.all(
          (Array.isArray(studentsResponse.data.data) ? studentsResponse.data.data : []).map(async (student) => {
            const sensorData = await fetchSensorData(student._id)
            const percentages = calculatePercentages(sensorData)
            
            return {
              ...student,
              stressLevel: {
                label: percentages.stressLabel,
                color: percentages.stressColor,
                value: percentages.stress
              },
              history: generateFakeHistory(),
              sensorData,
              sensorHistory: generateSensorHistory()
            }
          })
        )
        
        setStudents(studentsWithData)

      } catch (err) {
        console.error('Erreur lors du chargement des élèves de la classe:', err)
        setError(err.response?.data?.message || 'Erreur lors du chargement des élèves de la classe.')
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchClassStudents()
    } else {
      setError('ID de la classe non spécifié.')
      setLoading(false)
    }
  }, [id])

  const fetchPrediction = async (studentId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`http://localhost:5000/api/admin/predict-stress/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPredictionData(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération de la prédiction:', error)
    }
  }

  useEffect(() => {
    if (selectedStudentHistory) {
      fetchPrediction(selectedStudentHistory._id)
    }
  }, [selectedStudentHistory])

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner color="primary" />
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

  return (
    <div className="class-students-details">
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <CardTitle tag="h4">Élèves de la classe : {classeInfo?.niveau} {classeInfo?.section}</CardTitle>
          <div>
            <Button color='secondary' onClick={() => navigate('/classes')}>
              Retour aux Classes
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {students.length === 0 ? (
            <Alert color="info">Aucun élève trouvé pour cette classe ou la classe n'existe pas.</Alert>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Classe</th>
                  <th>Niveau de Stress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>{student.prenom} {student.nom}</td>
                    <td>
                      {student.classe && student.classe.niveau && student.classe.section 
                        ? `${student.classe.niveau} ${student.classe.section}`
                        : student.classe?.nom || 'Non assigné'}
                    </td>
                    <td>
                      <Badge color={student.stressLevel.color}>
                        {student.stressLevel.label}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        color="info"
                        size="sm"
                        onClick={() => {
                          setSelectedStudentHistory(student)
                          toggleHistoryModal()
                        }}
                        className="me-1"
                      >
                        <BarChart2 size={14} /> Historique
                      </Button>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedStudentSensors(student)
                          toggleSensorModal()
                        }}
                      >
                        <Watch size={14} /> Capteurs
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Row className='match-height'>
        <Col xl='12' md='6' xs='12'>
          <Card className='card-statistics'>
            <CardHeader>
              <CardTitle tag='h4'>Niveau de Stress des Élèves</CardTitle>
              <CardText className='card-text font-small-2 me-25 mb-0'>
                Total: {students.length} élèves
              </CardText>
            </CardHeader>
            <CardBody className='statistics-body'>
              <Row>
                <Col xl='4' sm='6' className='mb-2 mb-xl-0'>
                  <div className='d-flex align-items-center'>
                    <div className='avatar bg-light-success me-2'>
                      <div className='avatar-content'>
                        <TrendingUp className='avatar-icon text-success' />
                      </div>
                    </div>
                    <div className='my-auto'>
                      <h4 className='fw-bolder mb-0'>{students.filter(s => s.stressLevel.label === 'Faible').length}</h4>
                      <CardText className='font-small-3 mb-0'>Niveau Faible</CardText>
                      <div className='progress mt-1' style={{ height: '6px' }}>
                        <div
                          className='progress-bar bg-success'
                          role='progressbar'
                          style={{ width: `${(students.filter(s => s.stressLevel.label === 'Faible').length / students.length) * 100}%` }}
                          aria-valuenow={students.filter(s => s.stressLevel.label === 'Faible').length}
                          aria-valuemin='0'
                          aria-valuemax={students.length}
                        />
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xl='4' sm='6' className='mb-2 mb-xl-0'>
                  <div className='d-flex align-items-center'>
                    <div className='avatar bg-light-warning me-2'>
                      <div className='avatar-content'>
                        <TrendingUp className='avatar-icon text-warning' />
                      </div>
                    </div>
                    <div className='my-auto'>
                      <h4 className='fw-bolder mb-0'>{students.filter(s => s.stressLevel.label === 'Modéré').length}</h4>
                      <CardText className='font-small-3 mb-0'>Niveau Modéré</CardText>
                      <div className='progress mt-1' style={{ height: '6px' }}>
                        <div
                          className='progress-bar bg-warning'
                          role='progressbar'
                          style={{ width: `${(students.filter(s => s.stressLevel.label === 'Modéré').length / students.length) * 100}%` }}
                          aria-valuenow={students.filter(s => s.stressLevel.label === 'Modéré').length}
                          aria-valuemin='0'
                          aria-valuemax={students.length}
                        />
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xl='4' sm='6'>
                  <div className='d-flex align-items-center'>
                    <div className='avatar bg-light-danger me-2'>
                      <div className='avatar-content'>
                        <TrendingUp className='avatar-icon text-danger' />
                      </div>
                    </div>
                    <div className='my-auto'>
                      <h4 className='fw-bolder mb-0'>{students.filter(s => s.stressLevel.label === 'Élevé').length}</h4>
                      <CardText className='font-small-3 mb-0'>Niveau Élevé</CardText>
                      <div className='progress mt-1' style={{ height: '6px' }}>
                        <div
                          className='progress-bar bg-danger'
                          role='progressbar'
                          style={{ width: `${(students.filter(s => s.stressLevel.label === 'Élevé').length / students.length) * 100}%` }}
                          aria-valuenow={students.filter(s => s.stressLevel.label === 'Élevé').length}
                          aria-valuemin='0'
                          aria-valuemax={students.length}
                        />
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Modal isOpen={showHistoryModal} toggle={toggleHistoryModal} className="modal-dialog-centered modal-lg">
        <ModalHeader toggle={toggleHistoryModal}>
          Historique de {selectedStudentHistory?.prenom} {selectedStudentHistory?.nom}
        </ModalHeader>
        <ModalBody>
          {selectedStudentHistory && (
            <div>
              {/* Statistiques rapides */}
              <Row className='mb-1'>
                <Col md='3'>
                  <Card className='bg-light-success'>
                    <CardBody className='py-1'>
                      <h6 className='text-success mb-0'>Niveau Moyen</h6>
                      <h3 className='text-success mb-0'>
                        {(() => {
                          const avg = selectedStudentHistory.history.reduce((acc, curr) => {
                            const level = curr.stress === 'Faible' ? 20 : curr.stress === 'Modéré' ? 50 : 80;
                            return acc + level;
                          }, 0) / selectedStudentHistory.history.length;
                          return avg.toFixed(1) + '%';
                        })()}
                      </h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col md='3'>
                  <Card className='bg-light-warning'>
                    <CardBody className='py-1'>
                      <h6 className='text-warning mb-0'>Niveau Max</h6>
                      <h3 className='text-warning mb-0'>
                        {(() => {
                          const maxLevel = selectedStudentHistory.history.reduce((max, curr) => {
                            const level = curr.stress === 'Faible' ? 20 : curr.stress === 'Modéré' ? 50 : 80;
                            return Math.max(max, level);
                          }, 0);
                          return maxLevel + '%';
                        })()}
                      </h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col md='3'>
                  <Card className='bg-light-danger'>
                    <CardBody className='py-1'>
                      <h6 className='text-danger mb-0'>Périodes de Stress Élevé</h6>
                      <h3 className='text-danger mb-0'>
                        {selectedStudentHistory.history.filter(h => h.stress === 'Élevé').length}
                      </h3>
                    </CardBody>
                  </Card>
                </Col>
                <Col md='3'>
                  <Card className='bg-light-info'>
                    <CardBody className='py-1'>
                      <h6 className='text-info mb-0'>Total des Jours</h6>
                      <h3 className='text-info mb-0'>{selectedStudentHistory.history.length}</h3>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Prédiction et Analyse */}
              <Row className='mb-1'>
                <Col md='12'>
                  <Card className='bg-light-info'>
                    <CardBody className='py-1'>
                      <div className='d-flex justify-content-between align-items-center'>
                        <h6 className='text-info mb-0'>Prédiction du Stress</h6>
                        <div className='d-flex align-items-center'>
                          <span className='text-info me-1'>
                            {(() => {
                              const prediction = predictStressLevel(selectedStudentHistory.history);
                              return prediction.predictedStress + '%';
                            })()}
                          </span>
                          <span className={`text-${(() => {
                            const prediction = predictStressLevel(selectedStudentHistory.history);
                            return prediction.trend === '↑' ? 'danger' : prediction.trend === '↓' ? 'success' : 'warning';
                          })()}`}>
                            {(() => {
                              const prediction = predictStressLevel(selectedStudentHistory.history);
                              return prediction.trend;
                            })()}
                          </span>
                        </div>
                      </div>
                      <small className='text-muted'>Confiance: {(() => {
                        const prediction = predictStressLevel(selectedStudentHistory.history);
                        return prediction.confidence + '%';
                      })()}</small>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Pattern et Anomalies */}
              <Row className='mb-1'>
                <Col md='12'>
                  <Card>
                    <CardHeader className='py-1'>
                      <h6 className='mb-0'>Analyse du Stress</h6>
                    </CardHeader>
                    <CardBody className='py-1'>
                      {(() => {
                        const prediction = predictStressLevel(selectedStudentHistory.history);
                        return (
                          <>
                            <Alert color='info' className='mb-1 py-1'>
                              <strong>{prediction.recommendations.title}</strong>
                              <br />
                              {prediction.recommendations.description}
                              <br />
                              <small>{prediction.recommendations.advice}</small>
                            </Alert>
                            
                            {prediction.anomalies.length > 0 && (
                              <Alert color='warning' className='mb-0 py-1'>
                                <strong>Anomalies détectées :</strong>
                                <br />
                                {prediction.anomalies.map((anomaly, index) => (
                                  <div key={index} className='mt-1'>
                                    Jour {anomaly.index + 1} : Niveau de stress {anomaly.value}%
                                    {anomaly.severity === 'high' && ' (Sévérité élevée)'}
                                    {anomaly.severity === 'medium' && ' (Sévérité moyenne)'}
                                  </div>
                                ))}
                              </Alert>
                            )}
                          </>
                        );
                      })()}
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Conseils */}
              <Row className='mb-1'>
                <Col md='12'>
                  <Card>
                    <CardHeader className='py-1'>
                      <h6 className='mb-0'>Conseils et Recommandations</h6>
                    </CardHeader>
                    <CardBody className='py-1'>
                      {(() => {
                        const prediction = predictStressLevel(selectedStudentHistory.history);
                        return (
                          <>
                            {prediction.advice && prediction.advice.map((item, idx) => (
                              <Alert key={idx} color={item.type} className='mb-1 py-1'>
                                {item.message}
                              </Alert>
                            ))}
                          </>
                        );
                      })()}
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <h5 className='mb-1'>Niveau de stress sur 7 jours:</h5>
              <div className='table-responsive'>
                <table className='table table-hover'>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Niveau de Stress</th>
                      <th>Statut</th>
                      <th>Évolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudentHistory.history.map((data, index) => {
                      const stressLevel = data.stress === 'Faible' ? 20 : data.stress === 'Modéré' ? 50 : 80;
                      const color = data.stress === 'Faible' ? 'success' : data.stress === 'Modéré' ? 'warning' : 'danger';
                      
                      let evolution = '';
                      if (index < selectedStudentHistory.history.length - 1) {
                        const prevStress = selectedStudentHistory.history[index + 1].stress;
                        const prevLevel = prevStress === 'Faible' ? 20 : prevStress === 'Modéré' ? 50 : 80;
                        const diff = stressLevel - prevLevel;
                        if (Math.abs(diff) > 10) {
                          evolution = diff > 0 ? '↑' : '↓';
                        }
                      }

                      return (
                        <tr key={index}>
                          <td>{data.date}</td>
                          <td>
                            <div className='d-flex align-items-center'>
                              <div className='progress flex-grow-1 me-2' style={{ height: '8px' }}>
                                <div
                                  className={`progress-bar bg-${color}`}
                                  role='progressbar'
                                  style={{ width: `${stressLevel}%` }}
                                  aria-valuenow={stressLevel}
                                  aria-valuemin='0'
                                  aria-valuemax='100'
                                />
                              </div>
                              <span>{stressLevel}%</span>
                            </div>
                          </td>
                          <td>
                            <Badge color={color}>{data.stress}</Badge>
                          </td>
                          <td>
                            {evolution && (
                              <span className={`text-${evolution === '↑' ? 'danger' : 'success'}`}>
                                {evolution}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Légende */}
              <div className='mt-3'>
                <h6>Légende :</h6>
                <div className='d-flex gap-3'>
                  <div>
                    <Badge color='success' className='me-1'>Faible</Badge>
                    <small className='text-muted'>≤ 30%</small>
                  </div>
                  <div>
                    <Badge color='warning' className='me-1'>Modéré</Badge>
                    <small className='text-muted'>31-70%</small>
                  </div>
                  <div>
                    <Badge color='danger' className='me-1'>Élevé</Badge>
                    <small className='text-muted'>{'>'} 70%</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleHistoryModal}>
            Fermer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal pour les données des capteurs */}
      <Modal isOpen={showSensorModal} toggle={toggleSensorModal} className="modal-dialog-centered modal-lg">
        <ModalHeader toggle={toggleSensorModal} className="bg-light">
          <div className="d-flex align-items-center">
            <Watch size={24} className="me-2" />
            <div>
              <h4 className="mb-0">Monitoring en Temps Réel</h4>
              <small className="text-muted">
                {selectedStudentSensors?.prenom} {selectedStudentSensors?.nom}
                {lastUpdate && (
                  <span className="ms-2 text-success">
                    (Dernière mise à jour: {lastUpdate.toLocaleTimeString()})
                  </span>
                )}
                {!isRealData && (
                  <Badge color="warning" className="ms-2">
                    Mode Simulation
                  </Badge>
                )}
                {connectionError && (
                  <Badge color="danger" className="ms-2">
                    {connectionError}
                  </Badge>
                )}
              </small>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="text-center">
              <Spinner color="primary" />
              <p className="mt-2">Chargement des données en temps réel...</p>
            </div>
          ) : error ? (
            <Alert color="danger">{error}</Alert>
          ) : sensorData ? (
            <div>
              <Row className="mb-4">
                <Col md='4'>
                  <Card className='sensor-card bg-light-primary'>
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="avatar bg-primary me-2">
                            <Activity size={20} className="text-white" />
                          </div>
                          <div>
                            <h6 className='mb-0'>Pulsation de Peau</h6>
                            <div className="d-flex align-items-center">
                              <h3 className='text-primary mb-0 me-2'>{sensorData.skinPulse}</h3>
                              <small className="text-success">
                                <TrendingUp size={14} /> {sensorData.percentages.skinPulse.toFixed(1)}%
                              </small>
                            </div>
                            <small className="text-muted">BPM</small>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md='4'>
                  <Card className='sensor-card bg-light-danger'>
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="avatar bg-danger me-2">
                            <Heart size={20} className="text-white" />
                          </div>
                          <div>
                            <h6 className='mb-0'>Rythme Cardiaque</h6>
                            <div className="d-flex align-items-center">
                              <h3 className='text-danger mb-0 me-2'>{sensorData.heartRate}</h3>
                              <small className="text-success">
                                <TrendingUp size={14} /> {sensorData.percentages.heartRate.toFixed(1)}%
                              </small>
                            </div>
                            <small className="text-muted">BPM</small>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md='4'>
                  <Card className='sensor-card bg-light-warning'>
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="avatar bg-warning me-2">
                            <Thermometer size={20} className="text-white" />
                          </div>
                          <div>
                            <h6 className='mb-0'>Température</h6>
                            <div className="d-flex align-items-center">
                              <h3 className='text-warning mb-0 me-2' style={{ minWidth: '80px' }}>
                                {Number(sensorData.temperature).toFixed(1)}°C
                              </h3>
                              <small className="text-success">
                                <TrendingUp size={14} /> {sensorData.percentages.temperature.toFixed(1)}%
                              </small>
                            </div>
                            <small className="text-muted">Température corporelle</small>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md="6">
                  <Card className="mb-4">
                    <CardHeader className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Niveau de Stress</h5>
                      <span className="text-success fw-bold">{sensorData.percentages.stress.toFixed(1)}%</span>
                    </CardHeader>
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="avatar bg-light-success me-2">
                          <Activity size={20} className="text-success" />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-2">Niveau Actuel</h6>
                          <Progress value={sensorData.percentages.stress} color="success" className="mb-2" />
                          <small className="text-muted d-block">Niveau de stress {sensorData.percentages.stress > 70 ? 'élevé' : 'modéré'}</small>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md="6">
                  <Card className="mb-4">
                    <CardHeader>
                      <h5 className="mb-0">Statut des Capteurs</h5>
                    </CardHeader>
                    <CardBody className="pt-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h6 className="mb-0">Pulsation de Peau</h6>
                          <small className="text-muted">Niveau {sensorData.percentages.skinPulse > 70 ? 'élevé' : 'normal'}</small>
                        </div>
                        <Badge color={sensorData.percentages.skinPulse > 70 ? 'warning' : 'success'} className="px-3 py-1" style={{ minWidth: '80px', textAlign: 'center' }}>
                          {Math.round(sensorData.skinPulse)} BPM
                        </Badge>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h6 className="mb-0">Rythme Cardiaque</h6>
                          <small className="text-muted">Niveau {sensorData.percentages.heartRate > 70 ? 'élevé' : 'normal'}</small>
                        </div>
                        <Badge color={sensorData.percentages.heartRate > 70 ? 'warning' : 'success'} className="px-3 py-1" style={{ minWidth: '80px', textAlign: 'center' }}>
                          {Math.round(sensorData.heartRate)} BPM
                        </Badge>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0">Température</h6>
                          <small className="text-muted">Niveau {sensorData.percentages.temperature > 70 ? 'élevé' : 'normal'}</small>
                        </div>
                        <Badge color={sensorData.percentages.temperature > 70 ? 'warning' : 'success'} className="px-3 py-1" style={{ minWidth: '80px', textAlign: 'center' }}>
                          {Number(sensorData.temperature).toFixed(1)}°C
                        </Badge>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <Alert color="warning">Aucune donnée disponible pour le moment</Alert>
          )}
        </ModalBody>
        <ModalFooter className="bg-light">
          <Button color="secondary" onClick={toggleSensorModal}>
            Fermer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default ClassStudentsDetails 