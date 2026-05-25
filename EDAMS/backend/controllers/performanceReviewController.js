const PerformanceReview = require('../models/PerformanceReview');
const Employee = require('../models/Employee');
const { validatePerformanceReviewData } = require('../validators/performanceReviewValidator');
const { findEmployeeById, resolveEmployeeObjectId } = require('../utilities/employeeUtils');

// Create performance review
exports.createPerformanceReview = async (req, res) => {
  try {

    // Extract employee_ID from request body or PRID
    const employeeCode =
      req.body.employee_ID ||
      req.body.performance_review_ID?.split("-")[0];

    if (!employeeCode) {
      return res.status(400).json({ errors: ["Employee code not provided!"] });
    }

    // Get employee record
    const employee = await findEmployeeById(employeeCode);

    // Standardized performance_review_ID (for safety)
    const performance_review_ID = `${employee.employee_ID}-${req.body.review_year}`;

    // Build review payload
    const reviewData = {
      ...req.body,
      performance_review_ID,
      employee_ID: employee._id,
      initials_name: employee.initials_name,
      job_title: employee.job_title,
      department: employee.department,
    };

    // Convert manager_ID to ObjectId
    if (req.body.manager_ID) {
      reviewData.manager_ID = await resolveEmployeeObjectId(req.body.manager_ID);
    }

    // Validate payload
    const validationErrors = validatePerformanceReviewData(reviewData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Prevent duplicates
    const existingPerformanceReview = await PerformanceReview.findOne({ performance_review_ID });
    if (existingPerformanceReview) {
      return res.status(400).json({
        errors: ["Performance review already exists for this employee and year!"],
      });
    }

    // Create performance review
    const newReview = await PerformanceReview.create(reviewData);

    // Create HR notification
    try {
      const employeeObj = await Employee.findById(newReview.employee_ID);
      const managerObj = await Employee.findById(newReview.manager_ID);

      await surveyNotificationController.createPerformanceSubmissionNotification(
        newReview,
        employeeObj,
        managerObj
      );
    } catch (notifyErr) {
      console.error("Error creating performance submission notification:", notifyErr.message);
    }

    res.status(201).json({
      message: "Performance review created successfully!",
      performanceReview: newReview,
    });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};

// Get all performance reviews
exports.getAllPerformanceReviews = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find()
      .populate("employee_ID", "employee_ID initials_name job_title department")
      .sort({ review_year: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ errors: [err.message] });
  }
};

// Get performance review by ID for Update
exports.getPerformanceReviewById = async (req, res) => {
  try {
    const { performance_review_ID } = req.params;

    // Extract employee_ID from PRID
    const employeeCode = performance_review_ID.split("-")[0];

    // Get employee reocrd
    const employee = await findEmployeeById(employeeCode);

    // Get performance review
    const performanceReview = await PerformanceReview.findOne({ performance_review_ID })
      .populate("employee_ID", "employee_ID initials_name department job_title")
      .populate("manager_ID", "employee_ID initials_name")
      .lean();

    // No performance review
    if (!performanceReview) {
      return res.status(200).json({
        success: true,
        type: "NO_REVIEW",
        employee: {
          employee_ID: employee.employee_ID,
          initials_name: employee.initials_name,
          department: employee.department,
          job_title: employee.job_title,
        },
        performanceReview: null,
      });
    }

    // Normalize Map objects to plain objects
    const closedResponses =
      performanceReview.closed_responses instanceof Map
        ? Object.fromEntries(performanceReview.closed_responses.entries())
        : performanceReview.closed_responses;

    const openResponses =
      performanceReview.open_responses instanceof Map
        ? Object.fromEntries(performanceReview.open_responses.entries())
        : performanceReview.open_responses;

    return res.status(200).json({
      success: true,
      type: "REVIEW_EXISTS",
      employee: {
        employee_ID: employee.employee_ID,
        initials_name: employee.initials_name,
        department: employee.department,
        job_title: employee.job_title,
      },
      performanceReview: {
        ...performanceReview,
        closed_responses: closedResponses,
        open_responses: openResponses,
        manager_ID: performanceReview.manager_ID?.employee_ID || "",
        manager_name: performanceReview.manager_ID?.initials_name || "",
      },
    });

  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};

// Update performance review
exports.updatePerformanceReview = async (req, res) => {
  try {
    const { performance_review_ID } = req.params;

    // Check for review
    const review = await PerformanceReview.findOne({ performance_review_ID });
    if (!review) {
      return res.status(404).json({ errors: ["Performance review not found!"] });
    }

    const payload = { ...req.body };
    delete payload.employee_ID; // Prevent frontend from changing employee

    // Resolve employee_ID from performance_review_ID
    const employeeCode = performance_review_ID.split("-")[0];
    const employee = await findEmployeeById(employeeCode);
    if (!employee) {
      return res.status(404).json({ errors: ["Employee not found!"] });
    }
    payload.employee_ID = employee._id;

    // Convert manager_ID to ObjectId if needed
    if (payload.manager_ID && /^EMP\d+$/.test(payload.manager_ID)) {
      payload.manager_ID = await resolveEmployeeObjectId(payload.manager_ID);
    }

    // Validate payload
    const validationErrors = validatePerformanceReviewData(payload);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Update review
    const updated = await PerformanceReview.findOneAndUpdate(
      { performance_review_ID },
      payload,
      { new: true, runValidators: true }
    );

    // Create HR Notification
    try {
      const employeeObj = await Employee.findById(updated.employee_ID);
      const managerObj = await Employee.findById(updated.manager_ID);

      await surveyNotificationController.createPerformanceSubmissionNotification(
        updated,
        employeeObj,
        managerObj
      );
    } catch (notifyErr) {
      console.error("Error creating performance submission notification:", notifyErr.message);
    }

    res.status(200).json({
      message: "Performance review updated successfully!",
      performanceReview: updated,
    });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};

// Delete performance review
exports.deletePerformanceReview = async (req, res) => {
  try {
    const { performance_review_ID } = req.params;

    // Check for review
    const review = await PerformanceReview.findOne({ performance_review_ID });
    if (!review) {
      return res.status(404).json({ errors: ["Performance review not found!"] });
    }

    await PerformanceReview.findOneAndDelete({ performance_review_ID });

    res.status(200).json({ message: "Performance review deleted successfully!" });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};


// Get performance review by performance_review_ID for View 
exports.getPerformanceReviewByPRID = async (req, res) => {
  try {
    const { performance_review_ID } = req.params;

    const review = await PerformanceReview.findOne({ performance_review_ID })
      .populate("employee_ID", "employee_ID initials_name job_title department")
      .populate("manager_ID", "employee_ID initials_name")
      .populate("hr_ID", "employee_ID initials_name");

    if (!review) {
      return res.status(404).json({ errors: ["Performance review not found!"] });
    }

    const output = review.toObject();
    output.manager_name = review.manager_ID?.initials_name || "";

    res.status(200).json([output]);

  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};


// HR Approve / Reject review
exports.updateStatusPerformanceReview = async (req, res) => {
  try {
    const { performance_review_ID } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ errors: ["Invalid approval status!"] });
    }

    const review = await PerformanceReview.findOne({ performance_review_ID });
    if (!review) {
      return res.status(404).json({ errors: ["Performance review not found!"] });
    }

    review.hr_ID = req.user?._id || req.body.hr_ID;
    review.approval = {
      status,
      approved_at: new Date(),
    };

    await review.save();

    res.status(200).json({
      message: `Performance review ${status.toLowerCase()} successfully!`,
      performanceReview: review,
    });

  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ errors: [err.message] });
  }
};
