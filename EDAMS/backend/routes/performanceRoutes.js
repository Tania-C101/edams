const express = require('express');
const router = express.Router();
const performanceDashboardController = require('../controllers/performanceDashboardController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/createEvaluation', authenticate, authorize('HR'), performanceDashboardController.createEvaluation);
router.put('/updateEvaluation/:evaluation_ID', authenticate, authorize('HR'), performanceDashboardController.updateEvaluation);
router.delete('/deleteEvaluation/:evaluation_ID', authenticate, authorize('HR'), performanceDashboardController.deleteEvaluation);

router.get('/getAllEvaluations', authenticate, performanceDashboardController.getAllEvaluations);
router.get('/getEvaluationById/:evaluation_ID', authenticate, performanceDashboardController.getEvaluationById);


module.exports = router;