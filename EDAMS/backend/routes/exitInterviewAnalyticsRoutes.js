const express = require("express");
const router = express.Router();
const exitInterviewAnalyticsController = require("../controllers/exitInterviewAnalyticsController");
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get("/getResignationsByReasonPerYear", authenticate, authorize('HR'), exitInterviewAnalyticsController.getResignationsByReasonPerYear);
router.get("/getResignationsByDepartment", authenticate, authorize('HR'), exitInterviewAnalyticsController.getResignationsByDepartment);
router.get("/getTotalResignationsPerYear", authenticate, authorize('HR'), exitInterviewAnalyticsController.getTotalResignationsPerYear);
router.get("/getTotalResignationsPerQuarter", authenticate, authorize('HR'), exitInterviewAnalyticsController.getTotalResignationsPerQuarter);

module.exports = router;
