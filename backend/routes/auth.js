const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

// Routes d'authentification
router.post('/login', authController.login)
router.post('/change-password', authController.changePassword)

// ... autres routes existantes ...

module.exports = router 