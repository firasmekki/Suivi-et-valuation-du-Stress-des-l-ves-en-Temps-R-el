import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Alert,
  Spinner
} from 'reactstrap'
import { User, Mail, Phone, MapPin } from 'react-feather'
import './ParentProfile.scss'

const ParentProfile = () => {
  const [parentInfo, setParentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchParentProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Non authentifié')
          setLoading(false)
          return
        }

        const response = await axios.get('http://localhost:5000/api/parents/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        setParentInfo(response.data.data)
        setLoading(false)
      } catch (err) {
        console.error('Erreur:', err)
        setError(err.response?.data?.message || 'Erreur lors du chargement du profil')
        setLoading(false)
      }
    }

    fetchParentProfile()
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner color="primary" />
      </div>
    )
  }

  return (
    <div className="parent-profile">
      <Card>
        <CardHeader>
          <CardTitle tag="h4">Mon Profil</CardTitle>
        </CardHeader>
        <CardBody>
          {error && <Alert color="danger">{error}</Alert>}
          
          <div className="profile-info">
            <Row>
              <Col md={6}>
                <div className="info-item">
                  <div className="info-label">
                    <User size={16} className="me-1" />
                    Prénom
                  </div>
                  <div className="info-value">{parentInfo?.prenom}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-item">
                  <div className="info-label">
                    <User size={16} className="me-1" />
                    Nom
                  </div>
                  <div className="info-value">{parentInfo?.nom}</div>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <div className="info-item">
                  <div className="info-label">
                    <Mail size={16} className="me-1" />
                    Email
                  </div>
                  <div className="info-value">{parentInfo?.email}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-item">
                  <div className="info-label">
                    <Phone size={16} className="me-1" />
                    Téléphone
                  </div>
                  <div className="info-value">{parentInfo?.telephone}</div>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <div className="info-item">
                  <div className="info-label">
                    <MapPin size={16} className="me-1" />
                    Adresse
                  </div>
                  <div className="info-value">{parentInfo?.adresse}</div>
                </div>
              </Col>
            </Row>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default ParentProfile 