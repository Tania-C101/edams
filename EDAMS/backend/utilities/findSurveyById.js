const SurveyDashboard = require('../models/SurveyDashboard');

// Find full survey document by survey_ID string
const findSurveyById = async (survey_ID) => {
  const survey = await SurveyDashboard.findOne({ survey_ID });
  if (!survey) throw new Error(`Survey ${survey_ID} not found!`);
  return survey;
};

module.exports = { findSurveyById };
