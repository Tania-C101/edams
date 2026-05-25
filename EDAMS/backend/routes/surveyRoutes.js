const express = require('express');
const router = express.Router();
const surveyDashboardController = require('../controllers/surveyDashboardController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/createSurvey', authenticate, authorize('HR'), surveyDashboardController.createSurvey);
router.put('/updateSurvey/:survey_ID', authenticate, authorize('HR'), surveyDashboardController.updateSurvey);
router.delete('/deleteSurvey/:survey_ID', authenticate, authorize('HR'), surveyDashboardController.deleteSurvey);

router.get('/getAllSurveys', authenticate, surveyDashboardController.getAllSurveys);
router.get('/getSurveyById/:survey_ID', authenticate, surveyDashboardController.getSurveyById);


module.exports = router;