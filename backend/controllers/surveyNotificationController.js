const SurveyNotification = require("../models/SurveyNotification");
const SurveyDashboard = require("../models/SurveyDashboard");
const PerformanceDashboard = require("../models/PerformanceDashboard");

// Fetch notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  const user = req.user;
  let filter = {};

  try {
    if (user.role === "Manager") {
      filter.notification_type = "PR-not";
    } else if (user.role === "Employee") {
      filter.notification_type = { $in: ["SE-not", "EES-not", "JSS-not", "LIS-not"] };
    } else if (user.role === "HR") {
      filter = {}; // show all notifications
    }

    const notifications = await SurveyNotification.find(filter)
      .sort({ scheduled_time: -1 })
      .populate("survey_ID", "survey_title");

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a notification manually
exports.createNotification = async (req, res) => {
  try {
    const notification = new SurveyNotification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Create survey notification for all employees
exports.createSurveyNotification = async (survey) => {
  try {
    let notificationType;
    if (survey.survey_ID.startsWith("EES")) notificationType = "EES-not";
    else if (survey.survey_ID.startsWith("JSS")) notificationType = "JSS-not";
    else if (survey.survey_ID.startsWith("LIS")) notificationType = "LIS-not";

    const message = `${survey.survey_ID} - ${survey.survey_title} has been opened and is active from ${survey.active_from.toLocaleDateString()} to ${survey.active_to.toLocaleDateString()}.`;

    const notification = new SurveyNotification({
      notification_type: notificationType,
      message_content: message,
      scheduled_time: new Date(),
      survey_ID: survey._id,
    });

    await notification.save();
  } catch (err) {
    console.error("Creating survey notification:", err.message);
  }
};

// Create performance/ self-evaluation notification for all employees
exports.createPerformanceNotification = async (evaluation) => {
  try {
    const message = `${evaluation.evaluation_ID} - ${evaluation.evaluation_title} has been opened and is active from ${evaluation.active_from.toLocaleDateString()} to ${evaluation.active_to.toLocaleDateString()}.`;

    const notification = new SurveyNotification({
      notification_type: "PR-not",
      message_content: message,
      scheduled_time: new Date(),
      survey_ID: null, // No survey link for performance evaluation
    });

    await notification.save();
  } catch (err) {
    console.error("Creating performance notification:", err.message);
  }
};

// Create survey notification for HR from employees
exports.createSubmissionNotification = async (submission, employee) => {
  try {
    let notificationType;

    if (submission.survey_code.startsWith("EES")) notificationType = "EES-not";
    else if (submission.survey_code.startsWith("JSS")) notificationType = "JSS-not";
    else if (submission.survey_code.startsWith("LIS")) notificationType = "LIS-not";
    else notificationType = "SE-not"; // Self Evaluation

    const message = `${submission.survey_code} submitted by ${employee.initials_name}`;

    const notification = new SurveyNotification({
      notification_type: notificationType,
      message_content: message,
      scheduled_time: new Date(),
      survey_ID: submission.survey_ID, // keep relation
      notification_status: "Unread",
    });

    await notification.save();
  } catch (err) {
    console.error("Creating submission notification:", err.message);
  }
};

// Create performance notification for HR from managers
exports.createPerformanceSubmissionNotification = async (review, employee, manager) => {
  try {
    const message = `Performance Review ${review.performance_review_ID} submitted by ${manager.initials_name} for ${employee.initials_name}`;

    const notification = new SurveyNotification({
      notification_type: "PR-not",
      message_content: message,
      scheduled_time: new Date(),
      survey_ID: null,
      notification_status: "Unread",
    });

    await notification.save();
  } catch (err) {
    console.error("Creating performance submission notification:", err.message);
  }
};

// Update notification
exports.updateNotificationStatus = async (req, res) => {
  try {
    const notification = await SurveyNotification.findByIdAndUpdate(
      req.params.id,
      { notification_status: "Read" },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};