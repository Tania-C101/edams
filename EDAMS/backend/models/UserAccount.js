const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userAccountSchema = new mongoose.Schema({
  // Uses Object ID for auto generation
  username: { type: String, unique: true, required: true },
  password: {
    type: String, required: true, match: [
      /^(?=.*\d).{8,}$/,
      'Password must be at least 8 characters long and contain at least one number!'
    ]
  },
  role: { type: String, enum: ['HR', 'Manager', 'Employee', 'Admin'], required: true },
  account_status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
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
}, { timestamps: true });

// Hash password before save
userAccountSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('UserAccount', userAccountSchema);