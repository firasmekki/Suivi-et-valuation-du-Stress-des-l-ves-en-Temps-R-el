const express = require('express')
const router = express.Router()
const { InfluxDB } = require('@influxdata/influxdb-client')
const { auth, checkRole } = require('../middleware/auth')

// Configuration InfluxDB
const influxConfig = {
  url: 'http://localhost:8086',
  token: 'votre_token_influxdb',
  org: 'votre_organisation',
  bucket: 'sensor_data'
}

// GET /api/sensors/:studentId
router.get('/:studentId', auth, checkRole(['admin', 'enseignant']), async (req, res) => {
  try {
    const { studentId } = req.params
    const queryApi = new InfluxDB({
      url: influxConfig.url,
      token: influxConfig.token
    }).getQueryApi(influxConfig.org)

    // Requête Flux pour récupérer les dernières données
    const fluxQuery = `
      from(bucket: "${influxConfig.bucket}")
        |> range(start: -1m)
        |> filter(fn: (r) => r["student_id"] == "${studentId}")
        |> filter(fn: (r) => r["_measurement"] == "sensor_data")
        |> last()
    `

    const result = await queryApi.collectRows(fluxQuery)
    
    if (result && result.length > 0) {
      const data = result[0]
      res.json({
        success: true,
        data: {
          skinPulse: data.skinPulse,
          heartRate: data.heartRate,
          temperature: data.temperature,
          timestamp: data._time
        }
      })
    } else {
      // Si aucune donnée n'est trouvée, renvoyer des données simulées
      const simulatedData = {
        skinPulse: Math.floor(Math.random() * 30) + 60, // 60-90 BPM
        heartRate: Math.floor(Math.random() * 20) + 70, // 70-90 BPM
        temperature: (Math.random() * 0.5) + 36.5, // 36.5-37.0 °C
        timestamp: new Date().toISOString()
      }
      res.json({
        success: true,
        data: simulatedData,
        isSimulated: true
      })
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données des capteurs:', error)
    // En cas d'erreur, renvoyer des données simulées
    const simulatedData = {
      skinPulse: Math.floor(Math.random() * 30) + 60,
      heartRate: Math.floor(Math.random() * 20) + 70,
      temperature: (Math.random() * 0.5) + 36.5,
      timestamp: new Date().toISOString()
    }
    res.json({
      success: true,
      data: simulatedData,
      isSimulated: true
    })
  }
})

module.exports = router 