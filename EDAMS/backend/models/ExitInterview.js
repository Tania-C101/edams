const mongoose = require('mongoose');

const exitInterviewSchema = new mongoose.Schema({
  // Uses ObjectId for auto generation
  initials_name: { type: String },
  doj: { type: Date },
  job_title: { type: String },
  department: { type: String },
  resignation_date: { type: Date, default: () => Date.now() },

  // Questions
  resignation_reason: { type: String, required: true },
  answers: { type: Map, of: Number, required: true },

  // Asset clearance
  asset_return_mobile: { type: String, enum: ['Yes', 'No', 'N/A'], required: true },
  asset_return_laptop: { type: String, enum: ['Yes', 'No', 'N/A'], required: true },
  asset_return_cable: { type: String, enum: ['Yes', 'No', 'N/A'], required: true },
  asset_return_id: { type: String, enum: ['Yes', 'No', 'N/A'], required: true },
  asset_return_other: { type: String, enum: ['Yes', 'No', 'N/A'], required: true },

  // Department clearance
  it_clearance_status: { type: String, enum: ['Yes', 'No', 'Pending'], required: true },
  admin_clearance_status: { type: String, enum: ['Yes', 'No', 'Pending'], required: true },
  hr_clearance_status: { type: String, enum: ['Yes', 'No', 'Pending'], required: true },

  // Foreign keys
  employee_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true,
    validate: {
      validator: async function (value) {
        const employee = await mongoose.model('Employee').findById(value);
        return !!employee;
      },
      message: 'Employee does not exist!'
    }
  },
  hr_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    validate: {
      validator: async function (value) {
        const employee = await mongoose.model('Employee').findById(value);
        return !!employee;
      },
      message: 'HR ID does not exist!'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('ExitInterview', exitInterviewSchema);