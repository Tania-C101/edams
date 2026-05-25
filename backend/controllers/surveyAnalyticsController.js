const SurveySubmission = require('../models/SurveySubmission');
const Employee = require('../models/Employee');
const { resolveEmployeeObjectId } = require('../utilities/employeeUtils');

// Get last 5 years including current year (2025)
function getLastFiveYears() {
  const currentYear = 2026;
  return Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
}

// Calculate average from an array
const avgOrNull = arr =>
  arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;

// Get all unique departments
exports.getDepartments = async (req, res) => {
  try {
    // Fetch distinct departments from Employee collection
    const departments = await Employee.distinct("department");

    if (!departments.length) {
      return res.status(200).json({ data: [], message: "No departments found!" });
    }

    res.json({ data: departments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all unique job titles
exports.getJobTitles = async (req, res) => {
  try {
    // Fetch distinct job titles from Employee collection
    const job_titles = await Employee.distinct("job_title");

    if (!job_titles.length) {
      return res.status(200).json({ data: [], message: "No job titles found!" });
    }

    res.json({ data: job_titles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Normalize scores to numbers
const normalizeSectionScores = (sectionScores) => {
  if (!sectionScores) return {};
  const normalized = {};
  for (const [key, value] of Object.entries(sectionScores)) {
    normalized[key] = Number(value) || 0;
  }
  return normalized;
};

// Average EES per year
exports.getEESAveragePerYear = async (req, res) => {
  try {
    const years = getLastFiveYears();

    // Fetch EES submissions for last 6 years
    const submissions = await SurveySubmission.find({
      survey_code: { $regex: /^EES-\d{4}$/, $options: 'i' },
      submittedAt: {
        $gte: new Date(`${years[0]}-01-01`),
        $lte: new Date(`${years[years.length - 1]}-12-31`),
      },
    }).lean();

    // Initialize year buckets
    const yearBuckets = {};
    years.forEach(y => (yearBuckets[y] = []));

    // Fill year buckets with totalScore
    submissions.forEach(sub => {
      const year = new Date(sub.submittedAt).getFullYear();
      if (years.includes(year)) {
        yearBuckets[year].push(sub.totalScore || 0);
      }
    });

    // Compute average per year
    const averages = years.map(y => avgOrNull(yearBuckets[y]));

    res.json({ years, averages });
  } catch (err) {
    console.error('EES Analytics Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Average EES per year by department
exports.getEESDepartmentTrends = async (req, res) => {
  try {
    const years = getLastFiveYears();
    const departments = await Employee.distinct("department");

    const result = {};
    departments.forEach(dep => result[dep] = {});

    for (const dep of departments) {
      const employees = await Employee.find({ department: dep }, { _id: 1 });
      const employeeIds = employees.map(e => e._id);

      // Year bucket
      years.forEach(y => result[dep][y] = []);

      const submissions = await SurveySubmission.find({
        survey_code: { $regex: /^EES-\d{4}$/i },
        employee_ID: { $in: employeeIds },
        submittedAt: {
          $gte: new Date(`${years[0]}-01-01`),
          $lte: new Date(`${years[4]}-12-31`)
        }
      });

      submissions.forEach(sub => {
        const year = new Date(sub.submittedAt).getFullYear();
        if (years.includes(year)) {
          result[dep][year].push(sub.totalScore || 0);
        }
      });

      // Compute averages
      years.forEach(y => {
        const arr = result[dep][y];
        result[dep][y] = arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
      });
    }

    res.json({ years, departmentTrends: result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Average JSS per year
exports.getJSSAveragePerYear = async (req, res) => {
  try {
    const years = getLastFiveYears();

    // Fetch JSS submissions for last 6 years
    const submissions = await SurveySubmission.find({
      survey_code: { $regex: /^JSS-\d{4}$/, $options: 'i' },
      submittedAt: {
        $gte: new Date(`${years[0]}-01-01`),
        $lte: new Date(`${years[years.length - 1]}-12-31`),
      },
    }).lean();

    // Initialize year buckets
    const yearBuckets = {};
    years.forEach(y => (yearBuckets[y] = []));

    // Fill year buckets with totalScore
    submissions.forEach(sub => {
      const year = new Date(sub.submittedAt).getFullYear();
      if (years.includes(year)) {
        yearBuckets[year].push(sub.totalScore || 0);
      }
    });

    // Compute average per year
    const averages = years.map(y => avgOrNull(yearBuckets[y]));

    res.json({ years, averages });
  } catch (err) {
    console.error('JSS Analytics Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Average JSS per year by department
exports.getJSSDepartmentTrends = async (req, res) => {
  try {
    const years = getLastFiveYears();
    const departments = await Employee.distinct("department");

    const result = {};
    departments.forEach(dep => result[dep] = {});

    for (const dep of departments) {
      const employees = await Employee.find({ department: dep }, { _id: 1 });
      const employeeIds = employees.map(e => e._id);

      // Year bucket
      years.forEach(y => result[dep][y] = []);

      const submissions = await SurveySubmission.find({
        survey_code: { $regex: /^JSS-\d{4}$/i },
        employee_ID: { $in: employeeIds },
        submittedAt: {
          $gte: new Date(`${years[0]}-01-01`),
          $lte: new Date(`${years[4]}-12-31`)
        }
      });

      submissions.forEach(sub => {
        const year = new Date(sub.submittedAt).getFullYear();
        if (years.includes(year)) {
          result[dep][year].push(sub.totalScore || 0);
        }
      });

      // Compute averages
      years.forEach(y => {
        const arr = result[dep][y];
        result[dep][y] = arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
      });
    }

    res.json({ years, departmentTrends: result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Average LIS per year
exports.getLISAveragePerYear = async (req, res) => {
  try {
    const years = getLastFiveYears();

    // Fetch LIS submissions for last 6 years
    const submissions = await SurveySubmission.find({
      survey_code: { $regex: /^LIS-\d{4}$/, $options: 'i' },
      submittedAt: {
        $gte: new Date(`${years[0]}-01-01`),
        $lte: new Date(`${years[years.length - 1]}-12-31`),
      },
    }).lean();

    // Initialize year buckets
    const yearBuckets = {};
    years.forEach(y => (yearBuckets[y] = []));

    // Fill year buckets with totalScore
    submissions.forEach(sub => {
      const year = new Date(sub.submittedAt).getFullYear();
      if (years.includes(year)) {
        yearBuckets[year].push(sub.totalScore || 0);
      }
    });

    // Compute average per year
    const averages = years.map(y => avgOrNull(yearBuckets[y]));

    res.json({ years, averages });
  } catch (err) {
    console.error('LIS Analytics Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Average LIS per year by department
exports.getLISDepartmentTrends = async (req, res) => {
  try {
    const years = getLastFiveYears();
    const departments = await Employee.distinct("department");

    const result = {};
    departments.forEach(dep => result[dep] = {});

    for (const dep of departments) {
      const employees = await Employee.find({ department: dep }, { _id: 1 });
      const employeeIds = employees.map(e => e._id);

      // Year bucket
      years.forEach(y => result[dep][y] = []);

      const submissions = await SurveySubmission.find({
        survey_code: { $regex: /^LIS-\d{4}$/i },
        employee_ID: { $in: employeeIds },
        submittedAt: {
          $gte: new Date(`${years[0]}-01-01`),
          $lte: new Date(`${years[4]}-12-31`)
        }
      });

      submissions.forEach(sub => {
        const year = new Date(sub.submittedAt).getFullYear();
        if (years.includes(year)) {
          result[dep][year].push(sub.totalScore || 0);
        }
      });

      // Compute averages
      years.forEach(y => {
        const arr = result[dep][y];
        result[dep][y] = arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
      });
    }

    res.json({ years, departmentTrends: result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Category averages for all employees
exports.getCategoryAverages = async (req, res) => {
  const { surveyType } = req.params;
  try {
    const submissions = await SurveySubmission.find({
      survey_code: { $regex: `^${surveyType}-` },
    });

    if (!submissions.length) return res.status(200).json({
      categoryAverages: {},
      message: `No submissions found for survey type ${surveyType}`
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    const firstSubmissionScores = submissions[0].sectionScores;
    const categories = firstSubmissionScores instanceof Map ? Array.from(firstSubmissionScores.keys()) : Object.keys(firstSubmissionScores);

    const yearlyCategoryTotals = {};
    categories.forEach(cat => {
      yearlyCategoryTotals[cat] = {};
      years.forEach(y => yearlyCategoryTotals[cat][y] = []);
    });

    submissions.forEach(sub => {
      const year = new Date(sub.submittedAt).getFullYear();
      const rawScores = sub.sectionScores instanceof Map ? Object.fromEntries(sub.sectionScores) : sub.sectionScores;
      const scores = normalizeSectionScores(rawScores);

      categories.forEach(cat => {
        if (scores[cat] !== undefined && yearlyCategoryTotals[cat][year] !== undefined) {
          yearlyCategoryTotals[cat][year].push(scores[cat]);
        }
      });
    });

    const categoryAverages = {};
    categories.forEach(cat => {
      categoryAverages[cat] = {};
      years.forEach(y => {
        const arr = yearlyCategoryTotals[cat][y];
        categoryAverages[cat][y] = arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
      });
    });

    res.json({ categoryAverages, years });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Employee category trends
exports.getEmployeeCategoryTrends = async (req, res) => {
  const { employee_ID, surveyType } = req.params;
  try {
    const objectId = await resolveEmployeeObjectId(employee_ID);
    const submissions = await SurveySubmission.find({
      employee_ID: objectId,
      survey_code: { $regex: `^${surveyType}-`, $options: "i" },
    }).sort({ submittedAt: 1 });

    if (!submissions.length) return res.status(200).
      json({ message: `No submissions found for employee ${employee_ID} (${surveyType})`, categoryTrends: {} });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    const categorySet = new Set();
    submissions.forEach(sub => {
      const rawScores = sub.sectionScores instanceof Map ? Object.fromEntries(sub.sectionScores) : sub.sectionScores || {};
      Object.keys(rawScores).forEach(cat => categorySet.add(cat));
    });
    const categories = Array.from(categorySet);

    const categoryTrends = {};
    categories.forEach(cat => {
      categoryTrends[cat] = {};
      years.forEach(y => categoryTrends[cat][y] = null);
    });

    submissions.forEach(sub => {
      const year = new Date(sub.submittedAt).getFullYear();
      const scores = sub.sectionScores instanceof Map ? Object.fromEntries(sub.sectionScores) : sub.sectionScores || {};
      Object.entries(scores).forEach(([cat, value]) => {
        if (categoryTrends[cat] && categoryTrends[cat][year] !== undefined) categoryTrends[cat][year] = Number(value) || 0;
      });
    });

    res.json({ categoryTrends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Employee yearly totals
exports.getEmployeeYearlyTotals = async (req, res) => {
  const { employee_ID, surveyType } = req.params;
  try {
    const objectId = await resolveEmployeeObjectId(employee_ID);
    const submissions = await SurveySubmission.find({
      employee_ID: objectId,
      survey_code: { $regex: `^${surveyType}-`, $options: "i" },
    }).sort({ submittedAt: 1 });

    if (!submissions.length) return res.status(200).json({
      total: {},
      message: `No submissions found for employee ${employee_ID} for survey ${surveyType}`
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    const yearlyTotals = {};
    submissions.forEach(sub => yearlyTotals[new Date(sub.submittedAt).getFullYear()] = Number(sub.totalScore) || 0);
    years.forEach(year => { if (yearlyTotals[year] === undefined) yearlyTotals[year] = null; });

    res.json({ total: yearlyTotals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};