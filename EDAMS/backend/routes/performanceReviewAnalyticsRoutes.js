const express = require("express");
const router = express.Router();
const performanceReviewAnalyticsController = require("../controllers/performanceReviewAnalyticsController");
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get("/getCategoryAveragesForPerformanceReview", authenticate, authorize('HR'), performanceReviewAnalyticsController.getCategoryAveragesForPerformanceReview);
router.get("/getYearlyAverageTrendForPerformanceReview", authenticate, authorize('HR'), performanceReviewAnalyticsController.getYearlyAverageTrendForPerformanceReview);
router.get("/getEmployeeCategoryTrendsForPerformanceReview/employee/:employee_ID", authenticate, authorize('HR'), performanceReviewAnalyticsController.getEmployeeCategoryTrendsForPerformanceReview);
router.get("/getEmployeeYearlyTotalsForPerformanceReview/employee/:employee_ID", authenticate, authorize('HR'), performanceReviewAnalyticsController.getEmployeeYearlyTotalsForPerformanceReview);

module.exports = router;
