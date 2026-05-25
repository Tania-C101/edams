const express = require('express');
const router = express.Router();
const exitInterviewController = require('../controllers/exitInterviewController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/createExitInterview', authenticate, authorize('HR'), exitInterviewController.createExitInterview);
router.get('/getAllExitInterviews', authenticate, authorize('HR'), exitInterviewController.getAllExitInterviews);
router.get('/getExitInterviewById/:employee_ID', authenticate, authorize('HR'), exitInterviewController.getExitInterviewById);
router.put('/updateExitInterview/:employee_ID', authenticate, authorize('HR'), exitInterviewController.updateExitInterview);
router.delete('/deleteExitInterview/:employee_ID', authenticate, authorize('HR'), exitInterviewController.deleteExitInterview);

module.exports = router;