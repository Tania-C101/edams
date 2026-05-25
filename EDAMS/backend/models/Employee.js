const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employee_ID: { type: String, unique: true, required: true, match: [/^EMP\d+$/, 'Employee ID must start with EMP followed by numbers (ex. EMP1, EMP2)!'] },
  employee_category: { type: String, enum: ['Executive', 'Non-Executive'], required: true },
  full_name: { type: String, required: true },
  initials_name: { type: String, required: true },
  address: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  dob: { type: Date, required: true },
  nic: { type: String, required: true, match: [/^\d{0,9}[vVxX]$|^\d{0,12}$/, 'NIC must be valid!'], },
  marital_status: { type: String, enum: ['Single', 'Married'], required: true },
  mobile: { type: String, match: [/^\d{0,10}$/, 'Mobile number must be 10 digits!'], },
  telephone: { type: String, match: [/^\d{0,10}$/, 'Telephone number must be 10 digits!'], },
  contact_person: String,
  contact_person_num: {
    type: String,
    validate: {
      validator: (v) => !v || /^\d{10}$/.test(v),
      message: 'Contact person number must be 10 digits!'
    }
  },
  department: { type: String, enum: ['Human Resources', 'Administration', 'Information Technology'], required: true },
  job_title: {
    type: String, enum: ['Intern',
      'Associate',
      'Executive',
      'Senior Executive',
      'Team Lead',
      'Assistant Manager',
      'Manager',
      'Senior Manager',
      'Assistant General Manager',
      'General Manager',
      'Administrator',
      'Associate Software Engineer',
      'Software Engineer',
      'Senior Software Engineer',
      'Tech Lead',
      'Architect',
      'Associate Project Manager',
      'Project Manager',
      'Associate QA Engineer',
      'QA Engineer',
      'Senior QA Engineer',
      'QA Lead',
      'Associate UI/UX Designer',
      'UI/UX Designer',
      'Senior UI/UX Designer',
      'UI/UX Lead'], required: true
  },
  doj: { type: Date, required: true },
  employment_status: { type: String, enum: ['Active', 'Inactive'], required: true },
});

module.exports = mongoose.model('Employee', employeeSchema);