const SurveySubmission = require('../models/SurveySubmission');

// Helper function
const findSubmissionById = async (submission_ID, res) => {
  try {
    const submission = await SurveySubmission.findOne({ submission_ID: submission_ID });
    if (!submission) {
      res.status(404).json({ error: 'Submission not found!' });
      return null;
    }
    return submission;
  } catch (err) {
    res.status(500).json({ error: err.message });
    return null;
  }
};

module.exports = { findSubmissionById };
