const express = require('express');
const router = express.Router();
const surveyAnalyticsController = require('../controllers/surveyAnalyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get("/getDepartments", authenticate, authorize('HR'), surveyAnalyticsController.getDepartments);
router.get("/getJobTitles", authenticate, authorize('HR'), surveyAnalyticsController.getJobTitles);
router.get('/getEESAveragePerYear', authenticate, authorize('HR'), surveyAnalyticsController.getEESAveragePerYear);
router.get('/getEESDepartmentTrends', authenticate, authorize('HR'), surveyAnalyticsController.getEESDepartmentTrends);
router.get('/getJSSAveragePerYear', authenticate, authorize('HR'), surveyAnalyticsController.getJSSAveragePerYear);
router.get('/getJSSDepartmentTrends', authenticate, authorize('HR'), surveyAnalyticsController.getJSSDepartmentTrends);
router.get('/getLISAveragePerYear', authenticate, authorize('HR'), surveyAnalyticsController.getLISAveragePerYear);
router.get('/getLISDepartmentTrends', authenticate, authorize('HR'), surveyAnalyticsController.getLISDepartmentTrends);
router.get("/getCategoryAverages/:surveyType", authenticate, authorize('HR'), surveyAnalyticsController.getCategoryAverages);
router.get("/getEmployeeCategoryTrends/:employee_ID/:surveyType", authenticate, authorize('HR'), surveyAnalyticsController.getEmployeeCategoryTrends);
router.get("/getEmployeeYearlyTotals/:employee_ID/:surveyType", authenticate, authorize('HR'), surveyAnalyticsController.getEmployeeYearlyTotals);

module.exports = router;


