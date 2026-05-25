const surveyNotificationValidator = (data) => {
  const errors = [];

  const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  // Notification Type
  const validTypes = ['EES-not', 'JSS-not', 'LIS-not', 'PR-not', 'SE-not'];

  if (!data.notification_type) {
    errors.push("Notification type is required!");
  } else if (!validTypes.includes(data.notification_type)) {
    errors.push("Invalid notification type!");
  }

  // Message Content
  if (!data.message_content || data.message_content.trim() === "") {
    errors.push("Message content is required!");
  }

  // Scheduled Time
  if (!data.scheduled_time) {
    errors.push("Scheduled time is required!");
  } else {
    const parsedDate = new Date(data.scheduled_time);

    if (isNaN(parsedDate.getTime())) {
      errors.push("Scheduled time must be a valid date!");
    } else {
      const now = new Date();
      if (parsedDate < now) {
        errors.push("Scheduled time cannot be in the past!");
      }
    }
  }

  // Notification Status
  const validStatuses = ["Pending", "Sent", "Failed"];
  if (data.notification_status && !validStatuses.includes(data.notification_status)) {
    errors.push("Invalid notification status!");
  }

  // Survey ID (must be ObjectId)
  if (!data.survey_ID) {
    errors.push("Survey ID is required!");
  } else if (!isObjectId(data.survey_ID.toString())) {
    errors.push("Survey ID must be a valid MongoDB ObjectId!");
  }

  return errors;
};

module.exports = { surveyNotificationValidator };
