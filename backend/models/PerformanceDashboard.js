const mongoose = require('mongoose');

const performanceDashboardSchema = new mongoose.Schema({
  evaluation_ID: { type: String, unique: true, required: true, match: [/^(PE|SE)-\d{4}$/, 'Evaluation ID must start with Evaluation Type followed by year (ex. PE-2025, SE-2025)!'] },
  evaluation_title: { type: String, required: true, trim: true },
  active_from: { type: Date, required: true },
  active_to: {
    type: Date, required: true, validate: {
      validator: function (value) {
        return value > this.active_from;
      },
      message: 'Active_to must be after Active_from!'
    }
  },
  evaluation_status: { type: String, enum: ['Active', 'Inactive', 'Expired'], required: true },
}, { timestamps: true });

// Pre-save hook to automatically sets evaluation_status to "Expired" if active_to is in the past
performanceDashboardSchema.pre('save', function (next) {
  const now = new Date();
  if (!this.isModified('evaluation_status')) {
    if (this.active_to < now) {
      this.evaluation_status = 'Expired';
    } else {
      this.evaluation_status = 'Active';
    }
  }
  next();
});

module.exports = mongoose.model('PerformanceDashboard', performanceDashboardSchema);