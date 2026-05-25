const UserAccount = require('../models/UserAccount');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.loginUserAccount = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await UserAccount.findOne({ username }).populate('employee_ID');
    if (!user || user.account_status === 'Inactive') {
      return res.status(401).json({ error: 'Invalid username or password!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password!' });
    }

    // Extract employee record
    const employee = user.employee_ID;
    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found!' });
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      {
        userId: user._id,
        employee_ID: employee.employee_ID,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      token,
      user: {
        username: user.username,
        role: user.role,
        employee_ID: employee.employee_ID,
      },
      employee,
      message: 'Login successful!',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
