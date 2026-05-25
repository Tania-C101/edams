const selfEvaluationValidator = (data) => {
  const errors = [];
  const currentYear = new Date().getFullYear();

  const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  // Rename eval_year → review_year for consistency
  if (!data.review_year) {
    errors.push("Evaluation year is required!");
  } else if (isNaN(Number(data.review_year))) {
    errors.push("Evaluation year must be a number!");
  } else {
    const year = Number(data.review_year);
    if (year !== currentYear && year !== currentYear - 1) {
      errors.push("Evaluation year must be current or previous year!");
    }
  }

  // Numeric fields
  const numericFields = [
    { key: "work_qual_score", label: "Work quality score" },
    { key: "com_score", label: "Communication score" },
    { key: "awareness_score", label: "Awareness score" },
    { key: "teamwork_score", label: "Teamwork score" },
    { key: "adaptability_score", label: "Adaptability score" },
    { key: "total_score", label: "Total score" },
  ];
  numericFields.forEach(f => {
    if (data[f.key] === undefined || data[f.key] === null || data[f.key] === "") {
      errors.push(`${f.label} is required!`);
    } else if (isNaN(Number(data[f.key]))) {
      errors.push(`${f.label} must be numeric!`);
    }
  });

  // Employee ID
  if (!data.employee_ID) errors.push("Employee ID is required!");
  else if (!isObjectId(data.employee_ID.toString())) errors.push("Employee ID must be a valid MongoDB ObjectId!");

  // Employee initials_name
  if (!data.initials_name || data.initials_name.trim() === "") errors.push("Employee name is required!");

  // Date of join
  if (!data.doj) errors.push("Date of join is required!");
  else if (isNaN(Date.parse(data.doj))) errors.push("Invalid date of join!");

  // Job title & Department
  if (!data.job_title || data.job_title.trim() === "") errors.push("Job title is required!");
  if (!data.department || data.department.trim() === "") errors.push("Department is required!");

  return errors;
};

module.exports = { selfEvaluationValidator };
