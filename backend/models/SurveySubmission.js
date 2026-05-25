const mongoose = require('mongoose');

const surveySubmissionSchema = new mongoose.Schema(
  {
    // Section scores for analytics
    sectionScores: {
      type: Map,
      of: Number,
      default: {}
    },

    // Total score of all sections
    totalScore: {
      type: Number,
      default: 0
    },

    // Foreign keys
    // Object ID of the Survey ID
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
    // Business ID of the Survey ID
    survey_code: {
      type: String,
      required: true,
      match: [/^(EES|JSS|LIS)-\d{4}$/, 'Invalid survey code format!'],
    },
    employee_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      validate: {
        validator: async function (value) {
          const employee = await mongoose.model('Employee').findById(value);
          return !!employee;
        },
        message: 'Employee does not exist!',
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One submission per employee per survey
surveySubmissionSchema.index(
  { survey_ID: 1, employee_ID: 1 },
  { unique: true }
);

// Derive survey_year from survey_code
surveySubmissionSchema.virtual('survey_year').get(function () {
  if (!this.survey_code) return null;
  const m = this.survey_code.match(/-(\d{4})$/);
  if (!m) return null;
  const yr = Number(m[1]);
  return Number.isFinite(yr) ? yr : null;
});

// Expose virtuals in toJSON / toObject so res.json includes survey_year
surveySubmissionSchema.set('toJSON', { virtuals: true });
surveySubmissionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SurveySubmission', surveySubmissionSchema);
