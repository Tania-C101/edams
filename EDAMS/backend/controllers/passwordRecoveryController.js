const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sendSMS = require('../utilities/sendSMS');
const PasswordRecovery = require('../models/PasswordRecovery');
const UserAccount = require('../models/UserAccount');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Request OTP
exports.requestOTP = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await UserAccount.findOne({ username }).populate('employee_ID');
    if (!user || !user.employee_ID) {
      return res.status(404).json({ error: 'User or employee record not found!' });
    }
    const phoneNumber = user.employee_ID.mobile;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Mobile number not available!' });
    }

    const otp = generateOTP();
    const now = new Date();
    const expiry = new Date(now.getTime() + 5 * 60000);

    // Creates recovery record
    const recovery = new PasswordRecovery({
      recovery_ID: crypto.randomUUID(),
      otp_code: otp,
      requested_time: now,
      expired_time: expiry,
      status: 'Pending',
      user_ID: user._id
    });

    // Expire all previous unverified OTPs for that user to prevent reuse or confusion
    await PasswordRecovery.updateMany(
      { user_ID: user._id, status: 'Pending' },
      { $set: { status: 'Expired', expired_time: new Date() } }
    );
    await recovery.save();

    // Use sendSMS utility
    // Simulated SMS sending (academic)
    await sendSMS(phoneNumber, `Your OTP is: ${otp}`);

    // Return OTP ONLY for academic/demo purposes
    // NOTE:
    // OTP is returned in response ONLY for academic/demo purposes.
    // In a real production system, OTP would be delivered via SMS or Email gateway.

    return res.status(200).json({
      message: 'OTP generated successfully (academic mode)!',
      otp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { username, otp_code } = req.body;

  try {
    const user = await UserAccount.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found!' });

    const otpRecord = await PasswordRecovery.findOne({
      user_ID: user._id,
      otp_code: otp_code,
    }).sort({ requested_time: -1 });

    // No OTP record
    if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP!' });

    // OTP expired
    const now = new Date();
    if (now > otpRecord.expired_time) {
      otpRecord.status = 'Expired';
      await otpRecord.save();
      return res.status(400).json({ message: 'OTP has expired!' });
    }

    // OTP verified
    otpRecord.status = 'Verified';
    await otpRecord.save();
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await UserAccount.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found!' });

    const otpRecord = await PasswordRecovery.findOne({
      user_ID: user._id,
      status: 'Verified',  // Only allow password reset if OTP was verified
    }).sort({ requested_time: -1 });

    if (!otpRecord) return res.status(400).json({ message: 'OTP not verified or invalid' });

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Mark OTP as used or expired to prevent reuse
    otpRecord.status = 'Used';
    await otpRecord.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Expire OTP
exports.expireOTP = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await UserAccount.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found!' });

    await PasswordRecovery.updateMany(
      { user_ID: user._id, expired_time: { $gt: new Date() } },
      { $set: { expired_time: new Date() } }
    );

    res.status(200).json({ message: 'All active OTPs expired!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};