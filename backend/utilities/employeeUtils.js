const Employee = require('../models/Employee');

// Find full employee document by employee_ID string
const findEmployeeById = async (employee_ID) => {
  const employee = await Employee.findOne({ employee_ID });
  if (!employee) throw new Error(`Employee ${employee_ID} not found!`);
  return employee;
};

// Resolve string employee_ID to ObjectId
const resolveEmployeeObjectId = async (employee_ID) => {
  const employee = await findEmployeeById(employee_ID);
  return employee._id;
};

module.exports = {
  findEmployeeById,
  resolveEmployeeObjectId,
};
