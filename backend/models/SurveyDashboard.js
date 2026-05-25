const mongoose = require('mongoose');

const surveyDashboardSchema = new mongoose.Schema({
  survey_ID: { type: String, unique: true, required: true, match: [/^(EES|JSS|LIS)-\d{4}$/, 'Survey ID must start with Survey Type followed by year (ex. EES-2025, JSS-2025, LIS-2025)!'] },
  survey_title: { type: String, required: true, trim: true },
  active_from: { type: Date, required: true },
  active_to: {
    type: Date, required: true, validate: {
      validator: function (value) {
        return value > this.active_from;
      },
      message: 'Active_to must be after Active_from!'
    }
  },
  survey_status: { type: String, enum: ['Active', 'Inactive', 'Expired'], required: true },
}, { timestamps: true });

// Pre-save hook to automatically sets evaluation_status to "Expired" if active_to is in the past
surveyDashboardSchema.pre('save', function (next) {
  const now = new Date();
  if (!this.isModified('survey_status')) {
    if (this.active_to < now) {
      this.survey_status = 'Inactive';
    } else {
      this.survey_status = 'Active';
    }
  }
  next();
});

module.exports = mongoose.model('SurveyDashboard', surveyDashboardSchema);