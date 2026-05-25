const mongoose = require('mongoose');

const surveyNotificationSchema = new mongoose.Schema({
  // Use ObjectId for auto generation
  notification_type: { type: String, enum: ['EES-not', 'JSS-not', 'LIS-not', 'PR-not', 'SE-not'], required: true },
  message_content: { type: String, required: true },
  scheduled_time: {
    type: Date, required: true,
  },
  delivered_time: { type: Date },
  notification_status: { type: String, enum: ["Unread", "Read"], default: "Unread" },

  // Foreign keys
  survey_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SurveyDashboard',
    required: false,
    validate: {
      validator: async function (value) {
        if (!value) return true; // allow null or undefined
        const survey = await mongoose.model('SurveyDashboard').findById(value);
        return !!survey;
      },
      message: 'Survey does not exist!'
    }
  }
}, { timestamps: true });

// Pre-save hook for delivered_time
surveyNotificationSchema.pre('save', function (next) {
  if (this.notification_status === 'Sent' && !this.delivered_time) {
    this.delivered_time = new Date();
  } else if (this.notification_status !== 'Sent') {
    this.delivered_time = undefined;
  }
  next();
});

module.exports = mongoose.model('SurveyNotification', surveyNotificationSchema);