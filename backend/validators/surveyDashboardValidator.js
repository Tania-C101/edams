const surveyDashboardValidator = (data) => {
  const errors = [];

  // Survey ID validation
  if (!data.survey_ID) {
    errors.push("Survey ID is required!");
  } else {
    const idPattern = /^(EES|JSS|LIS)-\d{4}$/;
    if (!idPattern.test(data.survey_ID)) {
      errors.push("Survey ID must follow format like EES-2020 or JSS-2024!");
    }
  }

  // Survey title validation
  if (!data.survey_title || data.survey_title.trim() === "") {
    errors.push("Survey title is required!");
  }

  // Active From validation
  if (!data.active_from) {
    errors.push("Active from date is required!");
  } else if (isNaN(Date.parse(data.active_from))) {
    errors.push("Active from must be a valid date!");
  }

  // Active To validation
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

  // Survey Status validation
  const validStatuses = ["Active", "Inactive", "Expired"];

  if (!data.survey_status) {
    errors.push("Survey status is required!");
  } else if (!validStatuses.includes(data.survey_status)) {
    errors.push("Survey status must be Active, Inactive, or Expired!");
  }

  return errors;
};

module.exports = { surveyDashboardValidator };
