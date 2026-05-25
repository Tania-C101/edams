const Employee = require('../models/Employee');
const { employeeValidator } = require('../validators/employeeValidator');
const { findEmployeeById } = require('../utilities/employeeUtils');

// Create employee
exports.createEmployee = async (req, res) => {
  try {

    // Validate request body
    const validationErrors = employeeValidator(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Create and save employee
    const employee = await Employee.create(req.body);
    res.status(201).json({ message: "Employee created successfully!", employee });
  } catch (err) {

    // Handle duplicate employee_ID error
    if (err.code === 11000) {
      return res.status(400).json({ errors: ["Employee ID already exists!"] });
    }
    res.status(500).json({ errors: [err.message] });
  }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ employee_ID: -1 });
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ errors: [err.message] });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await findEmployeeById(req.params.employee_ID);
    res.status(200).json(employee);
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {

    // Prevent changing employee_ID
    if (req.body.employee_ID && req.body.employee_ID !== req.params.employee_ID) {
      return res.status(400).json({ errors: ["Cannot change employee ID!"] });
    }

    // Validate updated data
    const validationErrors = employeeValidator(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Check if employee exists
    await findEmployeeById(req.params.employee_ID);

    // Update employee
    const updatedEmployee = await Employee.findOneAndUpdate(
      { employee_ID: req.params.employee_ID },
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Employee updated successfully!", employee: updatedEmployee });
  } catch (err) {

    // Handle duplicate error
    if (err.code === 11000) {
      return res.status(400).json({ errors: ["Employee ID already exists!"] });
    }
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {

    // Check if employee exists
    await findEmployeeById(req.params.employee_ID);

    // Delete employee
    await Employee.findOneAndDelete({ employee_ID: req.params.employee_ID });
    res.status(200).json({ message: "Employee deleted successfully!" });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};
