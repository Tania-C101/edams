const express = require('express');
const router = express.Router();
const userAccountController = require('../controllers/userAccountController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/createUserAccount', authenticate, authorize('Admin'), userAccountController.createUserAccount);
router.get('/getAllUserAccounts', authenticate, authorize('Admin'), userAccountController.getAllUserAccounts);
router.get('/getUserAccountById/:employee_ID', authenticate, authorize('Admin'), userAccountController.getUserAccountById);
router.put('/updateUserAccount/:employee_ID', authenticate, authorize('Admin'), userAccountController.updateUserAccount);
router.delete('/deactivateUserAccount/:employee_ID', authenticate, authorize('Admin'), userAccountController.deactivateUserAccount);

module.exports = router;