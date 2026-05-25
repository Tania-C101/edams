const express = require("express");
const router = express.Router();
const surveyNotificationController = require("../controllers/surveyNotificationController");
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get("/getNotifications", authenticate, authorize('HR', 'Manager', 'Employee', 'Admin'), surveyNotificationController.getNotifications);
router.post("/createNotification", authenticate, authorize('HR'), surveyNotificationController.createNotification);
router.patch("/updateNotificationStatus/:id", authenticate, authorize('HR'), surveyNotificationController.updateNotificationStatus);

module.exports = router;