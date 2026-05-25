const express = require('express');
const router = express.Router();
const performanceReviewController = require('../controllers/performanceReviewController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/createPerformanceReview', authenticate, authorize('Manager'), performanceReviewController.createPerformanceReview);
router.get('/getAllPerformanceReviews', authenticate, authorize('HR', 'Manager'), performanceReviewController.getAllPerformanceReviews);
router.get('/getPerformanceReviewById/:performance_review_ID', authenticate, authorize('HR', 'Manager'), performanceReviewController.getPerformanceReviewById);
router.get('/getPerformanceReviewByPRID/:performance_review_ID', authenticate, authorize("HR", "Manager"), performanceReviewController.getPerformanceReviewByPRID);
// router.get('/getEmployeeByEmpID/:empID', authenticate, authorize("HR", "Manager"), performanceReviewController.getEmployeeByEmpID);
router.put('/updatePerformanceReview/:performance_review_ID', authenticate, authorize('Manager'), performanceReviewController.updatePerformanceReview);
router.delete('/deletePerformanceReview/:performance_review_ID', authenticate, authorize('Manager'), performanceReviewController.deletePerformanceReview);
router.patch('/updateStatusPerformanceReview/:performance_review_ID', authenticate, authorize('HR'), performanceReviewController.updateStatusPerformanceReview);

module.exports = router;
