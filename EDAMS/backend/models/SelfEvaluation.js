const mongoose = require("mongoose");

// Closed question subdocument
const closedResponseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  score: { type: Number, required: true }
}, { _id: false });

const selfEvaluationSchema = new mongoose.Schema({
  review_year: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        const currentYear = new Date().getFullYear();
        return value === currentYear || value === currentYear - 1;
      },
      message: "Evaluation year must be either the current year or the previous year!"
    }
  },
  initials_name: { type: String },
  doj: { type: Date },
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

  // Foreign keys
  employee_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
    validate: {
      validator: async function (value) {
        const employee = await mongoose.model("Employee").findById(value);
        return !!employee;
      },
      message: "Employee does not exist!"
    }
  },

  performance_review_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PerformanceReview",
    validate: {
      validator: async function (value) {
        const review = await mongoose.model("PerformanceReview").findById(value);
        return !!review;
      },
      message: "Performance Review with this ID does not exist!"
    }
  },

  evaluation_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PerformanceDashboard",
    required: true,
    validate: {
      validator: async function (value) {
        const dashboard = await mongoose.model("PerformanceDashboard").findById(value);
        return !!dashboard;
      },
      message: "Invalid or missing self-evaluation dashboard reference!"
    }
  }

}, { timestamps: true });

module.exports = mongoose.model('SelfEvaluation', selfEvaluationSchema);
