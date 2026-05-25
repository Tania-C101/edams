// Updated validator to handle both string codes and ObjectIds
const validatePerformanceReviewData = (performanceReviewData) => {
  const errors = [];

  if (!performanceReviewData.review_year) {
    errors.push('Review year is required!');
  } else {
    const year = parseInt(performanceReviewData.review_year, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > 3000) {
      errors.push('Review year must be a valid year!');
    }
    if (year !== currentYear && year !== currentYear - 1) {
      errors.push('Review year must be either the current year or the previous year!');
    }
  }

  if (!performanceReviewData.initials_name) errors.push('Employee name is required!');
  if (!performanceReviewData.job_title) errors.push('Job title is required!');
  if (!performanceReviewData.department) errors.push('Department is required!');
  if (!performanceReviewData.employee_ID) errors.push('Employee ID is required!');
  if (!performanceReviewData.manager_ID) errors.push('Manager ID is required!');

  const numericFields = [
    "work_qual_score",
    "com_score",
    "awareness_score",
    "teamwork_score",
    "adaptability_score",
    "total_score"
  ];

  numericFields.forEach((field) => {
    if (performanceReviewData[field] === undefined || performanceReviewData[field] === null) {
      errors.push(`${field.replace(/_/g, " ")} is required!`);
    } else if (isNaN(Number(performanceReviewData[field]))) {
      errors.push(`${field.replace(/_/g, " ")} must be a number!`);
    }
  });

  // Object ID validation
  const { employee_ID, manager_ID, hr_ID } = performanceReviewData;

  // Convert all IDs to string for comparison
  const empIdStr = employee_ID?.toString();
  const mgrIdStr = manager_ID?.toString();
  const hrIdStr = hr_ID?.toString();

  // Business logic - Validate employee ID != manager_ID or hr_ID, and manager_ID != hr_ID
  if (empIdStr && mgrIdStr && empIdStr === mgrIdStr) {
    errors.push('Employee ID and Manager ID cannot be the same!');
  }

  if (empIdStr && hrIdStr && empIdStr === hrIdStr) {
    errors.push('Employee ID and HR ID cannot be the same!');
  }

  if (mgrIdStr && hrIdStr && mgrIdStr === hrIdStr) {
    errors.push('Manager ID and HR ID cannot be the same!');
  }

  return errors;
};

module.exports = { validatePerformanceReviewData };
