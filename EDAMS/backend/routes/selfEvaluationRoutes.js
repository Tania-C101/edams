const express = require('express');
const router = express.Router();
const selfEvaluationController = require('../controllers/selfEvaluationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/createSelfEvaluation', authenticate, authorize('Employee', 'HR', 'Manager', 'Admin'), selfEvaluationController.createSelfEvaluation);
router.get('/getAllSelfEvaluations', authenticate, authorize('HR'), selfEvaluationController.getAllSelfEvaluations);
router.get('/getSelfEvaluationByIdAndYear/employee/:employee_ID/year/:review_year', authenticate, authorize("HR"), selfEvaluationController.getSelfEvaluationByIdAndYear);
router.get('/getSelfEvaluationById/:evaluation_ID', authenticate, authorize("HR"), selfEvaluationController.getSelfEvaluationById);

// No update
// No delete
module.exports = router;