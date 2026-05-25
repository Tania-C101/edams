const PerformanceDashboard = require('../models/PerformanceDashboard');
const { performanceDashboardValidator } = require('../validators/performanceDashboardValidator');
const notificationController = require("../controllers/surveyNotificationController");

// Create evaluation
exports.createEvaluation = async (req, res) => {
  try {
    const data = req.body;

    // Validate data
    const errors = performanceDashboardValidator(data);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Create and save new evaluation
    const newEvaluation = new PerformanceDashboard({
      evaluation_ID: data.evaluation_ID,
      evaluation_title: data.evaluation_title,
      active_from: data.active_from,
      active_to: data.active_to,
      evaluation_status: data.evaluation_status,
    });

    // Save to database
    const savedEvaluationEntry = await newEvaluation.save();

    // Create notification
    await notificationController.createPerformanceNotification(savedEvaluationEntry);

    return res.status(201).json(savedEvaluationEntry);

  } catch (err) {

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ errors: ["Evaluation ID already exists!"] });
    }

    return res.status(500).json({ errors: ["Server Error"] });
  }
};

// Get all evaluations
exports.getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await PerformanceDashboard.find().sort({ active_to: -1 });
    return res.status(200).json(evaluations);
  } catch (err) {
    return res.status(500).json({ errors: [err.message] });
  }
};

// Get evaluation entry by ID
exports.getEvaluationById = async (req, res) => {
  try {
    const evaluation = await PerformanceDashboard.findOne({
      evaluation_ID: req.params.evaluation_ID,
    });

    if (!evaluation) {
      return res.status(404).json({ errors: ["Evaluation entry not found!"] });
    }

    return res.status(200).json(evaluation);
  } catch (err) {
    return res.status(500).json({ errors: [err.message] });
  }
};

// Update evaluation entry
exports.updateEvaluation = async (req, res) => {
  try {
    const evaluation = await PerformanceDashboard.findOne({
      evaluation_ID: req.params.evaluation_ID,
    });

    if (!evaluation) {
      return res.status(404).json({ errors: ["Evaluation entry not found!"] });
    }

    const data = req.body;

    // Validate data
    const errors = performanceDashboardValidator(data);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Update fields
    evaluation.evaluation_title = data.evaluation_title;
    evaluation.active_from = data.active_from;
    evaluation.active_to = data.active_to;
    evaluation.evaluation_status = data.evaluation_status;

    // Save to database
    const updatedEvaluation = await evaluation.save();

    // Create notification
    await notificationController.createPerformanceNotification(updatedEvaluation);

    return res.status(200).json({
      message: "Evaluation entry updated successfully!",
      updatedEvaluation,
    });

  } catch (err) {
    return res.status(500).json({ errors: [err.message] });
  }
};

// Delete evaluation entry
exports.deleteEvaluation = async (req, res) => {
  try {
    const deletedEvaluationEntry = await PerformanceDashboard.findOneAndDelete({
      evaluation_ID: req.params.evaluation_ID,
    });

    if (!deletedEvaluationEntry) {
      return res.status(404).json({ errors: ["Evaluation entry not found!"] });
    }

    return res.status(200).json({ message: "Evaluation entry deleted successfully!" });
  } catch (err) {
    return res.status(500).json({ errors: [err.message] });
  }
};
