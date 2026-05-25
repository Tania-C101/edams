const performanceDashboardValidator = (data) => {
  const errors = [];

  // Evaluation ID
  if (!data.evaluation_ID) {
    errors.push("Evaluation ID is required!");
  } else {
    const idPattern = /^(PE|SE)-\d{4}$/;
    if (!idPattern.test(data.evaluation_ID)) {
      errors.push("Evaluation ID must follow format like PE-2025 or SE-2025!");
    }
  }

  // Evaluation Title
  if (!data.evaluation_title || data.evaluation_title.trim() === "") {
    errors.push("Evaluation title is required!");
  }

  // Active From
  if (!data.active_from) {
    errors.push("Active from date is required!");
  } else if (isNaN(Date.parse(data.active_from))) {
    errors.push("Active from must be a valid date!");
  }

  // Active To
  if (!data.active_to) {
    errors.push("Active to date is required!");
  } else if (isNaN(Date.parse(data.active_to))) {
    errors.push("Active to must be a valid date!");
  } else if (data.active_from && !isNaN(Date.parse(data.active_from))) {
    const from = new Date(data.active_from);
    const to = new Date(data.active_to);

    if (to <= from) {
      errors.push("Active to must be after active from!");
    }
  }

  // Evaluation Status
  const validStatuses = ["Active", "Inactive", "Expired"];

  if (!data.evaluation_status) {
    errors.push("Evaluation status is required!");
  } else if (!validStatuses.includes(data.evaluation_status)) {
    errors.push("Evaluation status must be Active, Inactive, or Expired!");
  }

  return errors;
};

module.exports = { performanceDashboardValidator };
