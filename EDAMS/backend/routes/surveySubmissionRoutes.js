const express = require('express');
const router = express.Router();
const surveySubmissionController = require('../controllers/surveySubmissionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/createSurveySubmission', authenticate, authorize('Employee', 'HR', 'Manager', 'Admin'), surveySubmissionController.createSurveySubmission);
router.get('/getAllSurveySubmissions', authenticate, authorize('HR'), surveySubmissionController.getAllSurveySubmissions);
router.get('/getSurveySubmissionsBySurveyID/:survey_ID', authenticate, authorize('HR'), surveySubmissionController.getSurveySubmissionsBySurveyID);
router.get('/getSurveySubmissionById/:submission_ID', authenticate, authorize('HR'), surveySubmissionController.getSurveySubmissionById);

module.exports = router;