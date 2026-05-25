const Employee = require("../models/Employee");
const SurveySubmission = require("../models/SurveySubmission");

// Calculate attrition risk based on EES and JSS scores
function calculateAttritionRisk(eesScore, jssScore) {
  // Normalize if input is 0-100
  const ees = eesScore / 100;
  const jss = jssScore / 100;

  // Simple weighted formula: higher EES reduces risk, lower JSS increases risk
  const risk = 0.6 * (1 - ees) + 0.4 * (1 - jss); // risk between 0 and 1
  return Math.max(0, Math.min(1, risk));
}

exports.getAttritionPredictions = async (req, res) => {
  try {
    const END_YEAR = new Date().getFullYear() - 1;
    const START_YEAR = END_YEAR - 4;
    const employees = await Employee.find({});

    // Fetch all survey submissions
    const submissions = await SurveySubmission.find({
      survey_code: { $regex: "-(\\d{4})$" },
    });

    const submissionsByEmployee = {};
    for (const sub of submissions) {
      const year = parseInt(sub.survey_code.split("-")[1]);
      const type = sub.survey_code.split("-")[0];
      const empId = sub.employee_ID.toString();
      if (!submissionsByEmployee[empId]) submissionsByEmployee[empId] = {};
      if (!submissionsByEmployee[empId][year]) submissionsByEmployee[empId][year] = {};
      submissionsByEmployee[empId][year][type] = sub.totalScore || 0;
    }

    const predictions = [];

    for (const emp of employees) {
      const empIdStr = emp._id.toString();
      for (let year = START_YEAR; year <= END_YEAR; year++) {
        const ees = submissionsByEmployee[empIdStr]?.[year]?.EES ?? 0;
        const jss = submissionsByEmployee[empIdStr]?.[year]?.JSS ?? 0;
        const risk = calculateAttritionRisk(ees, jss);

        predictions.push({
          employee_id: emp.employee_ID,
          year,
          attrition_risk: risk,
          features: {
            department: emp.department || "Unknown",
            role: emp.job_title || "Unknown",
            tenure: emp.doj ? year - emp.doj.getFullYear() : 0,
          },
        });
      }
    }

    res.json({ predictions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
