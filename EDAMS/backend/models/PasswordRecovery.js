const mongoose = require('mongoose');

const passwordRecoverySchema = new mongoose.Schema({
  recovery_ID: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomUUID(),
  },
  otp_code: { type: String, required: true },
  requested_time: { type: Date, default: () => new Date() },
  expired_time: { type: Date },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Expired', 'Used'],
    default: 'Pending',
  },

  // Foreign keys
  user_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAccount',
    required: true,
    validate: {
      validator: async function (value) {
        const userAccount = await mongoose.model('UserAccount').findById(value);
        return !!userAccount;
      },
      message: 'User Account does not exist!'
    }
  },
}, { timestamps: true });

// Pre-save hook to set expired_time based on requested_time
passwordRecoverySchema.pre('save', function (next) {
  if (!this.expired_time) {
    // Set expired_time 5 minutes after requested_time
    this.expired_time = new Date(this.requested_time.getTime() + 5 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('PasswordRecovery', passwordRecoverySchema);