const express = require('express');
const router = express.Router();
const questionResponseController = require('../controllers/questionResponseController');

router.get('/submission/:submission_ID', questionResponseController.getQuestionResponsesBySubmissionID);

module.exports = router;