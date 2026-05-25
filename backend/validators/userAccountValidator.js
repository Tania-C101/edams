const UserAccount = require('../models/UserAccount');
const Employee = require('../models/Employee');

const validateUserAccount = (data) => {
  const errors = [];

  // Username
  if (!data.username || data.username.trim() === "") {
    errors.push("Username is required!");
  }

  // Password
  if (!data.password) {
    errors.push("Password is required!");
  } else {
    const passwordPattern = /^(?=.*\d).{8,}$/;
    if (!passwordPattern.test(data.password)) {
      errors.push("Password must be at least 8 characters long and contain at least one number!");
    }
  }

  // Role
  const validRoles = ["HR", "Manager", "Employee", "Admin"];
  if (!data.role) {
    errors.push("Role is required!");
  } else if (!validRoles.includes(data.role)) {
    errors.push("Invalid role!");
  }

  // Account Status
  const validStatuses = ["Active", "Inactive"];
  if (data.account_status && !validStatuses.includes(data.account_status)) {
    errors.push("Invalid account status!");
  }

  // Employee ID (ObjectId)
  const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  if (!data.employee_ID) {
    errors.push("Employee ID is required!");
  } else if (!isObjectId(data.employee_ID.toString())) {
    errors.push("Employee ID must be a valid MongoDB ObjectId!");
  }

  return errors;
};

// Additional Business Checks
const checkUsernameExists = async (username) => {
  const user = await UserAccount.findOne({ username: username.trim() });
  return !!user;
};

const validateRoleWithEmployee = async (role, employee_ID) => {
  const employee = await Employee.findById(employee_ID);

  if (!employee) {
    return "Employee not found!";
  }

  // Only HR department can be assigned HR role
  if (role === 'HR' && employee.department !== 'Human Resources') {
    return "Only employees from HR department can have the HR role!";
  }

  return null; // No error
};

module.exports = {
  validateUserAccount,
  checkUsernameExists,
  validateRoleWithEmployee,
};
