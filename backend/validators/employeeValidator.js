const employeeValidator = (employeeData) => {
  const errors = [];
  const {
    employee_ID,
    employee_category,
    full_name,
    initials_name,
    address,
    gender,
    dob,
    nic,
    marital_status,
    mobile,
    telephone,
    contact_person,
    contact_person_num,
    department,
    job_title,
    doj,
    employment_status,
  } = employeeData;

  // Employee ID
  if (!employee_ID) {
    errors.push("Employee ID is required!");
  } else if (!/^EMP[1-9]\d*$/.test(employee_ID)) {
    errors.push("Employee ID must start with EMP followed by numbers (ex: EMP1, EMP2)!");
  }

  // Category
  if (!employee_category) {
    errors.push("Employee category is required!");
  } else if (!["Executive", "Non-Executive"].includes(employee_category)) {
    errors.push("Employee category must be Executive or Non-Executive!");
  }

  // Names
  if (!full_name) errors.push("Full name is required!");
  if (!initials_name) errors.push("Name with initials is required!");

  // Address
  if (!address) errors.push("Address is required!");

  // Gender
  if (!gender) {
    errors.push("Gender is required!");
  } else if (!["Male", "Female"].includes(gender)) {
    errors.push("Gender must be Male or Female!");
  }

  // Date of birth
  if (!dob) {
    errors.push("Date of birth is required!");
  } else {
    const dobDate = new Date(dob);
    if (isNaN(dobDate)) {
      errors.push("Date of birth must be a valid date!");
    } else {
      const age = new Date().getFullYear() - dobDate.getFullYear();
      if (age < 18) errors.push("Employee must be at least 18 years old!");
    }
  }

  // NIC
  if (!nic) {
    errors.push("NIC is required!");
  } else if (!/^\d{9}[vVxX]$|^\d{12}$/.test(nic)) {
    errors.push("NIC must be valid!");
  }

  // Marital status
  if (!marital_status) {
    errors.push("Marital status is required!");
  } else if (!["Single", "Married"].includes(marital_status)) {
    errors.push("Marital status must be Single or Married!");
  }

  // Mobile
  if (!mobile) {
    errors.push("Mobile number is required!");
  } else if (!/^\d{10}$/.test(mobile)) {
    errors.push("Mobile number must be 10 digits!");
  }

  // Telephone
  if (telephone && !/^\d{10}$/.test(telephone)) {
    errors.push("Telephone number must be 10 digits!");
  }

  // Mobile ≠ Telephone
  if (mobile && telephone && mobile === telephone) {
    errors.push("Mobile and telephone numbers cannot be the same!");
  }

  // Contact person num
  if (contact_person_num && !/^\d{10}$/.test(contact_person_num)) {
    errors.push("Contact person number must be 10 digits!");
  }

  // Department
  const departments = ["Human Resources", "Administration", "Information Technology"];
  if (!department) {
    errors.push("Department is required!");
  } else if (!departments.includes(department)) {
    errors.push("Department must be a valid option!");
  }

  // Job title
  const jobTitles = [
    "Intern", "Associate", "Executive", "Senior Executive", "Team Lead",
    "Assistant Manager", "Manager", "Senior Manager", "Assistant General Manager",
    "General Manager", "Administrator", "Associate Software Engineer", "Software Engineer",
    "Senior Software Engineer", "Tech Lead", "Architect", "Associate Project Manager",
    "Project Manager", "Associate QA Engineer", "QA Engineer", "Senior QA Engineer",
    "QA Lead", "Associate UI/UX Designer", "UI/UX Designer", "Senior UI/UX Designer", "UI/UX Lead"
  ];
  if (!job_title) {
    errors.push("Job title is required!");
  } else if (!jobTitles.includes(job_title)) {
    errors.push("Invalid job title!");
  }

  // Date of join
  if (!doj) {
    errors.push("Date of join is required!");
  } else {
    const dojDate = new Date(doj);
    const dobDate = dob ? new Date(dob) : null;
    const now = new Date();

    if (isNaN(dojDate)) {
      errors.push("Date of joining must be a valid date!");
    } else {
      if (dobDate && dojDate <= dobDate) {
        errors.push("Date of joining must be after the date of birth!");
      }
      if (dojDate > now) {
        errors.push("Date of joining cannot be in the future!");
      }
    }
  }

  // Employment status
  if (!employment_status) {
    errors.push("Employment status is required!");
  } else if (!["Active", "Inactive"].includes(employment_status)) {
    errors.push("Employment status must be Active or Inactive!");
  }

  return errors;
};

module.exports = { employeeValidator };
