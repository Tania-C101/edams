const mongoose = require('mongoose');
const { Mixed } = mongoose.Schema.Types;

const questionResponseSchema = new mongoose.Schema(
  {
    section_title: { type: String, required: true },
    question_id: { type: String, required: true },
    question_text: { type: String, required: true },
    answer_value: { type: Mixed, required: true },

    survey_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SurveyDashboard',
      required: true,
      validate: {
        validator: async function (value) {
          const survey = await mongoose.model('SurveyDashboard').findById(value);
          return !!survey;
        },
        message: 'Survey does not exist!',
      },
    },
    survey_code: {
      type: String,
      required: true,
      match: [/^(EES|JSS|LIS)-\d{4}$/, 'Invalid survey code format!'],
    },
    submission_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SurveySubmission',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate responses for the same question in a submission
questionResponseSchema.index(
  { submission_ID: 1, question_id: 1 },
  { unique: true }
);

// Add static method **after schema creation**
questionResponseSchema.statics.calculateSectionScores = async function (submissionId) {
  const responses = await this.find({ submission_ID: submissionId });

  const sectionScores = {};

  responses.forEach(resp => {
    if (!sectionScores[resp.section_title]) {
      sectionScores[resp.section_title] = { total: 0, count: 0 };
    }
    const val = Number(resp.answer_value);
    if (!isNaN(val)) {
      sectionScores[resp.section_title].total += val;
      sectionScores[resp.section_title].count += 1;
    }
  });

  Object.keys(sectionScores).forEach(section => {
    const s = sectionScores[section];
    sectionScores[section] = s.count ? (s.total / s.count).toFixed(2) : null;
  });

  return sectionScores;
};

module.exports = mongoose.model('QuestionResponse', questionResponseSchema);
