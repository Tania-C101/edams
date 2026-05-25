const UserAccount = require('../models/UserAccount');
const bcrypt = require('bcryptjs');
const { findEmployeeById, resolveEmployeeObjectId } = require('../utilities/employeeUtils');
const { checkUsernameExists, validateRoleWithEmployee } = require('../validators/userAccountValidator');

// Create user account
exports.createUserAccount = async (req, res) => {
  try {
    const { username, password, role, employee_ID, ...otherFields } = req.body;

    // Check if username exists
    const userExists = await checkUsernameExists(username);
    if (userExists) return res.status(400).json({ errors: ["Username already exists!"] });

    // Get employee record
    const employee = await findEmployeeById(employee_ID);

    // Validate role compatibility with employee
    const roleError = await validateRoleWithEmployee(role, employee._id);
    if (roleError) return res.status(400).json({ errors: [roleError] });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account
    const userAccount = await UserAccount.create({
      username,
      password: hashedPassword,
      role,
      employee_ID: employee._id,
      ...otherFields
    });

    res.status(201).json({
      message: "User account created successfully!",
      userAccount
    });
  } catch (err) {
    const status = err.message.includes('not found') || err.message.includes('Invalid') ? 404 : 400;
    res.status(status).json({ errors: [err.message] });
  }
};

// Get all user accounts
exports.getAllUserAccounts = async (req, res) => {
  try {
    const userAccounts = await UserAccount.find()
      .populate("employee_ID", "employee_ID initials_name");

    res.status(200).json(userAccounts);
  } catch (err) {
    res.status(500).json({ errors: [err.message] });
  }
};

// Get user account by employee ID
exports.getUserAccountById = async (req, res) => {
  try {
    const employee = await findEmployeeById(req.params.employee_ID);

    const userAccount = await UserAccount.findOne({ employee_ID: employee._id })
      .populate('employee_ID', 'employee_ID');

    if (!userAccount) return res.status(404).json({ errors: ["User account for the employee ID is not found!"] });

    // Return readable employee_ID
    const responseData = {
      ...userAccount.toObject(),
      employee_ID: userAccount.employee_ID.employee_ID
    };

    res.status(200).json(responseData);
  } catch (err) {
    const status = err.message.includes('not found') || err.message.includes('Invalid') ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};

// Update user account
exports.updateUserAccount = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Get employee record
    const employee = await findEmployeeById(req.params.employee_ID);

    // Validate role if provided
    if (role) {
      const roleError = await validateRoleWithEmployee(role, employee._id);
      if (roleError) return res.status(400).json({ errors: [roleError] });
    }

    // Check username uniqueness if provided
    if (username) {
      const existingUser = await UserAccount.findOne({
        username,
        employee_ID: { $ne: employee._id }
      });
      if (existingUser) return res.status(400).json({ errors: ["Username already exists!"] });
    }

    // Build update data
    const updateData = { ...req.body };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    // Prevent accidentally employee_ID changes
    delete updateData.employee_ID;

    // Update account
    const userAccount = await UserAccount.findOneAndUpdate(
      { employee_ID: employee._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!userAccount) return res.status(404).json({ errors: ["User account for the employee ID is not found!"] });
    res.status(200).json({ message: "User account updated successfully!", userAccount });
  } catch (err) {
    const status = err.message.includes('not found') || err.message.includes('Invalid') ? 404 : 400;
    res.status(status).json({ errors: [err.message] });
  }
};

// Deactivate user account
exports.deactivateUserAccount = async (req, res) => {
  try {
    const employeeObjectId = await resolveEmployeeObjectId(req.params.employee_ID);

    const userAccount = await UserAccount.findOneAndUpdate(
      { employee_ID: employeeObjectId },
      { account_status: 'Inactive' },
      { new: true, runValidators: true }
    ).populate('employee_ID', 'employee_ID');

    if (!userAccount) return res.status(404).json({ errors: ["User account for this employee is not found!"] });

    const responseData = {
      ...userAccount.toObject(),
      employee_ID: userAccount.employee_ID.employee_ID
    };

    res.status(200).json({
      message: "User account deactivated successfully!",
      userAccount: responseData
    });
  } catch (err) {
    const status = err.message.includes('not found') || err.message.includes('Invalid') ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};
