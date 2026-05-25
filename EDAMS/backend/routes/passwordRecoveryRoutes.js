const express = require('express');
const router = express.Router();
const passwordRecoveryController = require('../controllers/passwordRecoveryController');

router.post('/requestOTP', passwordRecoveryController.requestOTP);
router.post('/verifyOTP', passwordRecoveryController.verifyOTP);
router.post('/resetPassword', passwordRecoveryController.resetPassword);
router.post('/expireOTP', passwordRecoveryController.expireOTP);

module.exports = router;
