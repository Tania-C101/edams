const mongoose = require('mongoose');

// Closed question subdocument
const closedResponseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  score: { type: Number, required: true }
}, { _id: false });

// Open question subdocument
const openResponseSchema = new mongoose.Schema({
  answer: { type: String, required: true }
}, { _id: false });

const performanceReviewSchema = new mongoose.Schema({
  performance_review_ID: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        return /^EMP\d+-\d{4}$/.test(value);
      },
      message: 'Performance Review ID must follow the format EMP1-2025!'
    }
  },
  review_year: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        const currentYear = new Date().getFullYear();
        return value === currentYear || value === currentYear - 1;
      },
      message: 'Review year must be either the current year or the previous year!'
    }
  },
  initials_name: { type: String },
  job_title: { type: String },
  department: { type: String },

  // Individual category scores
  work_qual_score: { type: Number, required: true },
  com_score: { type: Number, required: true },
  awareness_score: { type: Number, required: true },
  teamwork_score: { type: Number, required: true },
  adaptability_score: { type: Number, required: true },

  total_score: { type: Number, required: true },

  // Responses as objects keyed by question ID
  closed_responses: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  open_responses: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  approval: {
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    approved_at: {
      type: Date
    },
  },

  // Foreign keys
  employee_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    validate: {
      validator: async function (value) {
        const employee = await mongoose.model('Employee').findById(value);
        return !!employee;
      },
      message: 'Employee does not exist!'
    }
  },
  manager_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    validate: {
      validator: async function (value) {
        const manager = await mongoose.model('Employee').findById(value);
        return !!manager;
      },
      message: 'Manager does not exist!'
    }
  },
  hr_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    validate: {
      validator: async function (value) {
        const hr = await mongoose.model('Employee').findById(value);
        return !!hr;
      },
      message: 'HR does not exist!'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
