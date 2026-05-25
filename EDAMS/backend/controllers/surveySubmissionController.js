const SurveySubmission = require('../models/SurveySubmission');
const QuestionResponse = require('../models/QuestionResponse');
const { findEmployeeById } = require('../utilities/employeeUtils');
const { findSurveyById } = require('../utilities/findSurveyById');
const surveyNotificationController = require('../controllers/surveyNotificationController');

const surveyTypes = {
  EES: require('../data/questions_engagement.json'),
  JSS: require('../data/questions_job_satisfaction.json'),
  LIS: require('../data/questions_leadership.json')
};

// Create survey submission
exports.createSurveySubmission = async (req, res) => {
  const session = await SurveySubmission.startSession();
  session.startTransaction();

  try {
    const { survey_ID, employee_ID, closed_responses } = req.body;

    // Fetch survey and employee
    const survey = await findSurveyById(survey_ID);
    const employee = await findEmployeeById(employee_ID);

    // Prevent duplicate submission
    const existingSubmission = await SurveySubmission.findOne({
      survey_ID: survey._id,
      employee_ID: employee._id
    });

    if (existingSubmission) {
      return res.status(400).json({ error: "You already submitted this survey!" });
    }

    // Create submission record
    const [surveySubmission] = await SurveySubmission.create([{
      survey_ID: survey._id,
      employee_ID: employee._id,
      survey_code: survey.survey_ID
    }], { session });

    const submission_ID = surveySubmission._id;

    // Load correct question set
    const surveyPrefix = survey.survey_ID.split("-")[0];
    const questionsData = surveyTypes[surveyPrefix] || {};

    // Prepare question lookup for section & text
    const questionLookup = {};
    Object.values(questionsData).forEach(category => {
      category.questions.forEach(q => {
        questionLookup[q.id] = {
          question_text: q.text,
          section_title: category.title
        };
      });
    });

    // Map closed responses into documents
    const questionResponses = Object.entries(closed_responses).map(([questionId, answer]) => {
      const details = questionLookup[questionId] || {};

      return {
        survey_ID: survey._id,
        survey_code: survey.survey_ID,
        submission_ID,
        section_title: details.section_title || "Unknown Section",
        question_id: questionId,
        question_text: details.question_text || "Unknown Question",
        answer_value: answer
      };
    });

    // Insert question responses inside the session
    await QuestionResponse.insertMany(questionResponses, { session });

    // Calculate section scores & update submission
    const sectionScores = await QuestionResponse.calculateSectionScores(submission_ID);
    await SurveySubmission.findByIdAndUpdate(
      submission_ID,
      { sectionScores },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    // Create HR notificaton
    try {
      await surveyNotificationController.createSubmissionNotification(
        surveySubmission,
        employee
      );
    } catch (notifyErr) {
      console.error("Notification create error:", notifyErr.message);
    }

    // Final response
    res.status(201).json({
      message: "Survey submitted successfully!",
      submission: surveySubmission,
      sectionScores
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
};

// Get all survey submissions
exports.getAllSurveySubmissions = async (req, res) => {
  try {
    const surveySubmissions = await SurveySubmission.find()
      .populate("employee_ID", "employee_ID initials_name job_title department")
      .populate("survey_ID", "survey_ID");

    res.status(200).json(surveySubmissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get submissions by survey_ID
exports.getSurveySubmissionsBySurveyID = async (req, res) => {
  try {
    const { survey_ID } = req.params;

    const surveySubmissions = await SurveySubmission.find({ survey_code: survey_ID })
      .populate("employee_ID", "employee_ID initials_name job_title department")
      .populate("survey_ID", "survey_ID");

    if (!surveySubmissions.length) {
      return res.status(404).json({ error: `No submissions found for survey_ID=${survey_ID}` });
    }

    res.status(200).json(surveySubmissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get survey submission by submission_ID
exports.getSurveySubmissionById = async (req, res) => {
  try {
    const { submission_ID } = req.params;

    const submission = await SurveySubmission.findById(submission_ID)
      .populate("employee_ID", "employee_ID initials_name job_title department")
      .populate("survey_ID", "survey_ID");

    if (!submission) {
      return res.status(404).json({ error: `Survey submission not found for ID=${submission_ID}` });
    }

    const questions = await QuestionResponse.find({ submission_ID });

    res.status(200).json({
      submission,
      questions,
      sectionScores: submission.sectionScores
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
