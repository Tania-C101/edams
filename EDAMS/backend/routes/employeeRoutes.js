const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/createEmployee', authenticate, authorize('HR'), employeeController.createEmployee);
router.get('/getAllEmployees', authenticate, authorize('HR'), employeeController.getAllEmployees);
router.get('/getEmployeeById/:employee_ID', authenticate, authorize('HR'), employeeController.getEmployeeById);
router.put('/updateEmployee/:employee_ID', authenticate, authorize('HR'), employeeController.updateEmployee);
router.delete('/deleteEmployee/:employee_ID', authenticate, authorize('HR'), employeeController.deleteEmployee);

module.exports = router;