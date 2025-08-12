import React, { useState, useEffect } from 'react';
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
  Badge,
  Table,
  Progress
} from 'reactstrap';
import axios from 'axios';

const StressAlertTest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [stressLevel, setStressLevel] = useState(50);
  const [testResults, setTestResults] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [simulationActive, setSimulationActive] = useState(false);

  // Configuration axios avec token
  const getAxiosConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.');
      window.location.href = '/login';
      return null;
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Charger la liste des élèves
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const config = getAxiosConfig();
        if (!config) return;

        const response = await axios.get('http://localhost:5000/api/eleves', config);
        if (response.data.success) {
          setStudents(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedStudent(response.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des élèves:', err);
        setError('Erreur lors du chargement des élèves');
      }
    };

    fetchStudents();
  }, []);

  // Tester l'envoi d'une alerte de stress
  const handleTestAlert = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const config = getAxiosConfig();
      if (!config) return;

      const response = await axios.post(
        'http://localhost:5000/api/stress-alerts/test',
        {
          studentId: selectedStudent,
          stressLevel: parseInt(stressLevel)
        },
        config
      );

      if (response.data.success) {
        setTestResults(response.data.data);
        setSuccess('Test d\'alerte effectué avec succès');
      }
    } catch (err) {
      console.error('Erreur lors du test:', err);
      setError(err.response?.data?.message || 'Erreur lors du test');
    } finally {
      setLoading(false);
    }
  };

  // Forcer l'envoi d'une alerte
  const handleForceAlert = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const config = getAxiosConfig();
      if (!config) return;

      const response = await axios.post(
        'http://localhost:5000/api/stress-alerts/force',
        {
          studentId: selectedStudent,
          stressLevel: parseInt(stressLevel)
        },
        config
      );

      if (response.data.success) {
        setSuccess(`Alerte forcée envoyée à ${response.data.data.student.email}`);
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi forcé:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi forcé');
    } finally {
      setLoading(false);
    }
  };

  // Simuler une augmentation progressive du stress
  const handleSimulateStress = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSimulationActive(true);

    try {
      const config = getAxiosConfig();
      if (!config) return;

      const response = await axios.post(
        'http://localhost:5000/api/stress-alerts/simulate',
        {
          studentId: selectedStudent,
          duration: 6 // 6 minutes
        },
        config
      );

      if (response.data.success) {
        setSuccess('Simulation démarrée. Le stress augmentera progressivement.');
        
        // Attendre un peu puis récupérer les statistiques
        setTimeout(() => {
          fetchStats();
          fetchHistory();
        }, 10000);
      }
    } catch (err) {
      console.error('Erreur lors de la simulation:', err);
      setError(err.response?.data?.message || 'Erreur lors de la simulation');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les statistiques
  const fetchStats = async () => {
    try {
      const config = getAxiosConfig();
      if (!config) return;

      const response = await axios.get('http://localhost:5000/api/stress-alerts/stats', config);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des stats:', err);
    }
  };

  // Récupérer l'historique
  const fetchHistory = async () => {
    try {
      const config = getAxiosConfig();
      if (!config) return;

      const response = await axios.get(
        `http://localhost:5000/api/stress-alerts/history/${selectedStudent}`,
        config
      );
      if (response.data.success) {
        setHistory(response.data.data.history);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
    }
  };

  // Obtenir le nom de l'élève sélectionné
  const getSelectedStudentName = () => {
    const student = students.find(s => s._id === selectedStudent);
    return student ? `${student.prenom} ${student.nom}` : 'Aucun élève sélectionné';
  };

  // Obtenir la couleur du niveau de stress
  const getStressColor = (level) => {
    if (level > 80) return 'danger';
    if (level > 60) return 'warning';
    return 'success';
  };

  return (
    <div className="stress-alert-test">
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>🧪 Test des Alertes de Stress</CardTitle>
        </CardHeader>
        <CardBody>
          {error && <Alert color="danger">{error}</Alert>}
          {success && <Alert color="success">{success}</Alert>}

          <Row>
            <Col md='6'>
              <Form>
                <FormGroup>
                  <Label for='student'>Élève</Label>
                  <Input
                    type='select'
                    id='student'
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                  >
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.prenom} {student.nom} - {student.classeId?.niveau} {student.classeId?.section}
                      </option>
                    ))}
                  </Input>
                </FormGroup>

                <FormGroup>
                  <Label for='stressLevel'>Niveau de Stress (%)</Label>
                  <Input
                    type='range'
                    id='stressLevel'
                    min='0'
                    max='100'
                    value={stressLevel}
                    onChange={(e) => setStressLevel(e.target.value)}
                  />
                  <div className="d-flex justify-content-between">
                    <small>0%</small>
                    <Badge color={getStressColor(stressLevel)}>{stressLevel}%</Badge>
                    <small>100%</small>
                  </div>
                </FormGroup>

                <div className='d-flex gap-2'>
                  <Button 
                    color='primary' 
                    onClick={handleTestAlert}
                    disabled={loading || !selectedStudent}
                  >
                    {loading ? <Spinner size="sm" /> : 'Tester Alerte'}
                  </Button>
                  
                  <Button 
                    color='warning' 
                    onClick={handleForceAlert}
                    disabled={loading || !selectedStudent}
                  >
                    {loading ? <Spinner size="sm" /> : 'Forcer Alerte'}
                  </Button>
                  
                  <Button 
                    color='info' 
                    onClick={handleSimulateStress}
                    disabled={loading || !selectedStudent || simulationActive}
                  >
                    {loading ? <Spinner size="sm" /> : 'Simuler Stress'}
                  </Button>
                </div>
              </Form>
            </Col>

            <Col md='6'>
              <h5>📊 Informations</h5>
              <p><strong>Élève sélectionné :</strong> {getSelectedStudentName()}</p>
              <p><strong>Niveau de stress :</strong> {stressLevel}%</p>
              
              {testResults && (
                <div className="mt-3">
                  <h6>Résultats du test :</h6>
                  <ul>
                    <li>Stress élevé : {testResults.isHigh ? 'Oui' : 'Non'}</li>
                    <li>Stress en augmentation : {testResults.isIncreasing ? 'Oui' : 'Non'}</li>
                    <li>Alerte envoyée : {testResults.alertSent ? 'Oui' : 'Non'}</li>
                  </ul>
                </div>
              )}
            </Col>
          </Row>

          {/* Statistiques */}
          {stats && (
            <Row className="mt-4">
              <Col md='12'>
                <h5>📈 Statistiques Globales</h5>
                <Row>
                  <Col md='3'>
                    <Card className="text-center">
                      <CardBody>
                        <h4>{stats.totalStudents}</h4>
                        <p>Élèves surveillés</p>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md='3'>
                    <Card className="text-center">
                      <CardBody>
                        <h4 className="text-warning">{stats.highStressStudents}</h4>
                        <p>Stress élevé</p>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md='3'>
                    <Card className="text-center">
                      <CardBody>
                        <h4 className="text-danger">{stats.increasingStressStudents}</h4>
                        <p>Stress en augmentation</p>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md='3'>
                    <Card className="text-center">
                      <CardBody>
                        <h4 className="text-info">{stats.activeAlerts}</h4>
                        <p>Alertes actives</p>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}

          {/* Historique */}
          {history.length > 0 && (
            <Row className="mt-4">
              <Col md='12'>
                <h5>📊 Historique du Stress</h5>
                <Table striped>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Niveau</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(-10).reverse().map((entry, index) => (
                      <tr key={index}>
                        <td>{new Date(entry.timestamp).toLocaleString('fr-FR')}</td>
                        <td>
                          <Progress 
                            value={entry.level} 
                            color={getStressColor(entry.level)}
                            className="mb-0"
                          />
                          {entry.level}%
                        </td>
                        <td>
                          <Badge color={getStressColor(entry.level)}>
                            {entry.level > 80 ? 'Très élevé' : 
                             entry.level > 60 ? 'Élevé' : 'Normal'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default StressAlertTest; 