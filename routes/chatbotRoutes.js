const express = require('express');
const MedicalController = require('../controllers/medicalController');

const router = express.Router();
const medicalController = new MedicalController();

// Health check route
router.get('/', medicalController.healthCheck.bind(medicalController));

// Get medical advice route
router.post('/get-medical-advice', medicalController.getMedicalAdvice.bind(medicalController));

module.exports = router;