const ExitInterview = require('../models/ExitInterview');
const { findEmployeeById, resolveEmployeeObjectId } = require('../utilities/employeeUtils');
const { normalizeAnswers } = require('../utilities/responseUtils');
const { exitInterviewValidator } = require('../validators/exitInterviewValidator');

// Create exit interview
exports.createExitInterview = async (req, res) => {
  try {

    // Convert employee_ID and hr_ID to ObjectIds
    req.body.employee_ID = await resolveEmployeeObjectId(req.body.employee_ID);
    if (req.body.hr_ID) req.body.hr_ID = await resolveEmployeeObjectId(req.body.hr_ID);

    // Normalize answers if provided
    if (req.body.answers) req.body.answers = normalizeAnswers(req.body.answers);

    // Validate request body
    const validationErrors = exitInterviewValidator(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Create exit interview record
    const exitInterview = await ExitInterview.create(req.body);
    res.status(201).json({
      message: "Exit Interview record created successfully!",
      exitInterview,
    });
  } catch (err) {

    // Handle duplicate employee_ID error
    if (err.code === 11000) {
      return res.status(400).json({ errors: ["Exit interview for this Employee already exists!"] });
    }
    return res.status(500).json({ errors: [err.message] });
  }
};

// Get all exit interviews
exports.getAllExitInterviews = async (req, res) => {
  try {
    const exitInterviews = await ExitInterview.find()
      .sort({ resignation_date: -1 })
      .populate("employee_ID", "employee_ID initials_name job_title department")
      .populate("hr_ID", "employee_ID initials_name");

    res.status(200).json(exitInterviews);
  } catch (err) {
    return res.status(500).json({ errors: [err.message] });
  }
};

// Get exit interview by employee_ID
exports.getExitInterviewById = async (req, res) => {
  try {
    const employee = await findEmployeeById(req.params.employee_ID);

    const exitInterview = await ExitInterview.findOne({ employee_ID: employee._id })
      .populate("hr_ID", "employee_ID initials_name");

    res.status(200).json({
      employee: {
        employee_ID: employee.employee_ID,
        initials_name: employee.initials_name,
        doj: employee.doj,
        job_title: employee.job_title,
        department: employee.department,
      },
      exitInterview: exitInterview || null,
    });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return res.status(status).json({ errors: [err.message] });
  }
};

// Update exit interview
exports.updateExitInterview = async (req, res) => {
  try {

    // Convert employee_ID and hr_ID to ObjectIds
    req.body.employee_ID = await resolveEmployeeObjectId(req.params.employee_ID);
    if (req.body.hr_ID) req.body.hr_ID = await resolveEmployeeObjectId(req.body.hr_ID);

    // Normalize answers if provided
    if (req.body.answers) req.body.answers = normalizeAnswers(req.body.answers);

    // Validate request body
    const validationErrors = exitInterviewValidator(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Update exit interview
    const exitInterview = await ExitInterview.findOneAndUpdate(
      { employee_ID: req.body.employee_ID },
      req.body,
      { new: true, runValidators: true }
    );

    if (!exitInterview) {
      return res.status(404).json({ errors: ["Exit Interview not found!"] });
    }

    res.status(200).json({
      message: "Exit Interview updated successfully!",
      exitInterview,
    });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return res.status(status).json({ errors: [err.message] });
  }
};

// Delete exit interview
exports.deleteExitInterview = async (req, res) => {
  try {
    const employee_ID = await resolveEmployeeObjectId(req.params.employee_ID);

    const exitInterview = await ExitInterview.findOneAndDelete({ employee_ID });

    if (!exitInterview) {
      return res.status(404).json({ errors: ["Exit Interview record not found!"] });
    }

    res.status(200).json({ message: "Exit Interview record deleted successfully!" });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return res.status(status).json({ errors: [err.message] });
  }
};
