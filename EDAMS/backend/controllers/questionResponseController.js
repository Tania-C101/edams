const QuestionResponse = require('../models/QuestionResponse');
const findSubmissionById = require('../utilities/findSubmissionById');
const { questionResponseValidator } = require('../validators/questionResponseValidator');

// Get question responses by submission ID
exports.getQuestionResponsesBySubmissionID = async (req, res) => {
  try {

    // Find the submission
    const submission = await findSubmissionById(req.params.submission_ID, res);
    if (!submission) return;
    console.log("Found submission:", submission);

    // Validate submission_ID format
    const validationErrors = questionResponseValidator({ submission_ID: req.params.submission_ID });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }
    console.log("Validation passed for submission_ID:", req.params.submission_ID);

    // Get all question responses for the submission
    const questionResponses = await QuestionResponse.find({ submission_ID: submission._id });
    if (questionResponses.length === 0) {
      return res.status(404).json({ errors: ["Question responses not found for this submission!"] });
    }
    console.log("Fetched question responses:", questionResponses);

    // Calculate section scores
    const sectionScores = await QuestionResponse.calculateSectionScores(submission._id);
    console.log("Calculated section scores:", sectionScores);

    res.status(200).json({
      submission_ID: submission._id,
      survey_code: submission.survey_code,
      questionResponses,
      sectionScores
    });
  } catch (err) {
    res.status(500).json({ errors: [err.message] });
  }
};

// No create; Handled by SurveySubmission
// No get all question responses
// No update
// No delete