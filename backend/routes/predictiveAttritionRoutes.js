const express = require("express");
const router = express.Router();
const predictiveAttritionController = require("../controllers/predictiveAttritionController");
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get("/getAttritionPredictions", authenticate, authorize('HR'), predictiveAttritionController.getAttritionPredictions);

module.exports = router;
