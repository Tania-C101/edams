const SurveyDashboard = require('../models/SurveyDashboard');
const { surveyDashboardValidator } = require('../validators/surveyDashboardValidator');
const notificationController = require("../controllers/surveyNotificationController");

// Create survey
exports.createSurvey = async (req, res) => {
  try {

    // Validate request body
    const validationErrors = surveyDashboardValidator(req.body);
    if (validationErrors.length > 0) return res.status(400).json({ validationErrors });

    // Create new survey instance
    const newSurveyEntry = new SurveyDashboard({
      survey_ID: req.body.survey_ID,
      survey_title: req.body.survey_title,
      active_from: req.body.active_from,
      active_to: req.body.active_to,
      survey_status: req.body.survey_status || 'Inactive',
    });

    // Save to database
    const savedSurveyEntry = await newSurveyEntry.save();

    // Create notification
    await notificationController.createSurveyNotification(savedSurveyEntry);

    res.status(201).json(savedSurveyEntry);
  } catch (err) {

    // Handle duplicate survey_ID
    if (err.code === 11000) {
      return res.status(400).json({ errors: ['Survey ID already exists!'] });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ errors: ['Server Error'] });
  }
};

// Get all survey entries
exports.getAllSurveys = async (req, res) => {
  try {
    const surveys = await SurveyDashboard.find().sort({ active_to: -1 });
    res.status(200).json(surveys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get survey entry by survey_ID
exports.getSurveyById = async (req, res) => {
  try {
    const survey = await SurveyDashboard.findOne({ survey_ID: req.params.survey_ID });
    if (!survey) return res.status(404).json({ error: 'Survey record not found!' });

    res.status(200).json(survey);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update survey entries
exports.updateSurvey = async (req, res) => {
  try {
    const survey = await SurveyDashboard.findOne({ survey_ID: req.params.survey_ID });
    if (!survey) return res.status(404).json({ error: 'Survey record not found!' });

    // Validate request body
    const validationErrors = surveyDashboardValidator(req.body);
    if (validationErrors.length > 0) return res.status(400).json({ validationErrors });

    // Update only provided fields
    survey.survey_title = req.body.survey_title || survey.survey_title;
    survey.active_from = req.body.active_from || survey.active_from;
    survey.active_to = req.body.active_to || survey.active_to;
    survey.survey_status = req.body.survey_status || survey.survey_status;

    // Save to database
    const updatedSurvey = await survey.save();

    // Create notification
    await notificationController.createSurveyNotification(updatedSurvey);

    res.status(200).json({ message: 'Survey updated successfully!', updatedSurvey });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: err.message });
  }
};

// Delete survey entry
exports.deleteSurvey = async (req, res) => {
  try {
    const survey = await SurveyDashboard.findOneAndDelete({ survey_ID: req.params.survey_ID });
    if (!survey) return res.status(404).json({ error: 'Survey record not found!' });

    res.status(200).json({ message: 'Survey deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
