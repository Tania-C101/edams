const Employee = require('../models/Employee');
const SelfEvaluation = require("../models/SelfEvaluation");
const PerformanceDashboard = require("../models/PerformanceDashboard");
const { resolveEmployeeObjectId } = require('../utilities/employeeUtils');

// Create self-evaluation
exports.createSelfEvaluation = async (req, res) => {
  try {
    const { employee_ID, evaluation_ID, review_year } = req.body;

    // Validate Employee
    const employee = await Employee.findOne({ employee_ID });
    if (!employee) throw new Error("Employee not found");

    // Validate Evaluation (Performance Dashboard)
    const performanceDashboard = await PerformanceDashboard.findOne({ evaluation_ID });
    if (!performanceDashboard) throw new Error("Performance dashboard entry not found");

    // Build review data
    const reviewData = {
      ...req.body,
      employee_ID: employee._id,
      evaluation_ID: performanceDashboard._id,
      review_year,
      initials_name: employee.initials_name,
      job_title: employee.job_title,
      department: employee.department,
      doj: employee.doj,
    };

    // Check if review exists for same employee and year
    const existingReview = await SelfEvaluation.findOne({
      employee_ID: employee._id,
      review_year
    });
    if (existingReview) throw new Error("Self evaluation already exists for this employee and year!");

    const selfEvaluation = await SelfEvaluation.create(reviewData);
    res.status(201).json({ message: "Self evaluation created successfully!", selfEvaluation });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 400;
    res.status(status).json({ errors: [err.message] });
  }
};

// Get all self-evaluations
exports.getAllSelfEvaluations = async (req, res) => {
  try {
    const selfEvaluations = await SelfEvaluation.find()
      .populate('employee_ID', 'employee_ID initials_name job_title department')
      .populate('evaluation_ID', 'evaluation_ID active_from active_to')
      .sort({ review_year: -1, createdAt: -1 });

    res.status(200).json(selfEvaluations);

  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};

// Get self-evaluation by Employee & Year
exports.getSelfEvaluationByIdAndYear = async (req, res) => {
  try {
    const { employee_ID, review_year } = req.params;
    const year = parseInt(review_year, 10);

    if (!employee_ID || !year) throw new Error("Employee ID and year required");

    // Convert employee_ID  to ObjectId
    const employeeObjectId = await resolveEmployeeObjectId(employee_ID);

    const selfEvaluation = await SelfEvaluation.findOne({
      employee_ID: employeeObjectId,
      review_year: year
    })
      .populate('employee_ID', 'employee_ID initials_name job_title department')
      .populate('evaluation_ID', 'evaluation_ID active_from active_to');

    if (!selfEvaluation) throw new Error("Self-Evaluation not found");

    res.status(200).json({ selfEvaluation });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};

// Get self-evaluation by Evaluation ID
exports.getSelfEvaluationById = async (req, res) => {
  try {
    const { evaluation_ID } = req.params;

    const evaluation = await SelfEvaluation.findById(evaluation_ID)
      .populate('employee_ID', 'employee_ID initials_name job_title department')
      .populate('evaluation_ID', 'evaluation_ID active_from active_to');

    if (!evaluation) throw new Error("Self-Evaluation not found");

    res.status(200).json({ evaluation });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};
