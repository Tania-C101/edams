const exitInterviewValidator = (exitInterviewData) => {
  const errors = [];
  const {
    initials_name,
    doj,
    job_title,
    department,
    resignation_date,
    resignation_reason,
    asset_return_mobile,
    asset_return_laptop,
    asset_return_cable,
    asset_return_id,
    asset_return_other,
    it_clearance_status,
    admin_clearance_status,
    hr_clearance_status,
    employee_ID,
    hr_ID,
  } = exitInterviewData;

  // Employee name
  if (!initials_name) {
    errors.push("Employee name is required!");
  }

  // DOJ
  if (!doj) {
    errors.push("Date of join is required!");
  } else if (isNaN(new Date(doj))) {
    errors.push("Invalid date of join!");
  }

  // Job title
  if (!job_title) {
    errors.push("Job title is required!");
  }

  // Department
  if (!department) {
    errors.push("Department is required!");
  }

  // Resignation date
  if (!resignation_date) {
    errors.push("Resignation date is required!");
  } else {
    const resignedDate = new Date(resignation_date);
    if (isNaN(resignedDate)) {
      errors.push("Invalid resignation date!");
    } else {
      const now = new Date();
      if (resignedDate > now) {
        errors.push("Resignation date cannot be in the future!");
      }
      if (doj) {
        const dojDate = new Date(doj);
        if (!isNaN(dojDate) && resignedDate < dojDate) {
          errors.push("Resignation date cannot be before Date of Join!");
        }
      }
    }
  }

  // Resignation reason
  if (!resignation_reason) {
    errors.push("Resignation reason is required!");
  }

  // Asset returns
  if (!asset_return_mobile) errors.push("Mobile return status is required!");
  if (!asset_return_laptop) errors.push("Laptop return status is required!");
  if (!asset_return_cable) errors.push("Cable return status is required!");
  if (!asset_return_id) errors.push("Office ID return status is required!");
  if (!asset_return_other) errors.push("Other asset return status is required!");

  // Clearance statuses
  if (!it_clearance_status) errors.push("IT clearance status is required!");
  if (!admin_clearance_status) errors.push("Admin clearance status is required!");
  if (!hr_clearance_status) errors.push("HR clearance status is required!");

  // IDs
  if (!employee_ID) errors.push("Employee ID is required!");
  if (!hr_ID) errors.push("HR ID is required!");
  if (employee_ID && hr_ID && String(employee_ID) === String(hr_ID)) {
    errors.push("Employee ID cannot be equal to HR ID!");
  }

  return errors;
};

module.exports = { exitInterviewValidator };
