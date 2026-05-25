const ExitInterview = require("../models/ExitInterview");

// Get resignations by reason per year
exports.getResignationsByReasonPerYear = async (req, res) => {
  try {
    const interviews = await ExitInterview.find();

    if (!interviews.length) {
      return res.status(200).json({ data: {}, message: "No exit interviews found!" });
    }

    const currentYear = new Date().getFullYear();

    // Last 6 years inclusive
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    const reasonCounts = {};

    interviews.forEach(interview => {
      if (!interview.resignation_date) return;

      const year = interview.resignation_date.getFullYear();
      if (!years.includes(year)) return;

      const reason = interview.resignation_reason || "Unknown";

      if (!reasonCounts[reason]) reasonCounts[reason] = {};
      reasonCounts[reason][year] = (reasonCounts[reason][year] || 0) + 1;
    });

    res.json({ data: reasonCounts, years });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get resignations by department per year
exports.getResignationsByDepartment = async (req, res) => {
  try {
    const interviews = await ExitInterview.find();

    if (!interviews.length) {
      return res.status(200).json({ data: {}, message: "No exit interviews found!" });
    }

    const currentYear = new Date().getFullYear();

    // Last 6 years inclusive
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    const deptCounts = {};

    interviews.forEach(interview => {
      if (!interview.resignation_date) return;

      const year = interview.resignation_date.getFullYear();
      if (!years.includes(year)) return;

      const dept = interview.department || "Unknown";

      if (!deptCounts[dept]) deptCounts[dept] = {};
      deptCounts[dept][year] = (deptCounts[dept][year] || 0) + 1;
    });

    res.json({ data: deptCounts, years });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get total resignations by year
exports.getTotalResignationsPerYear = async (req, res) => {
  try {
    const interviews = await ExitInterview.find();
    if (!interviews.length) {
      return res.status(200).json({ data: {}, message: "No exit interviews found!" });
    }

    const totalPerYear = {};

    interviews.forEach(interview => {
      const year = interview.resignation_date.getFullYear();
      totalPerYear[year] = (totalPerYear[year] || 0) + 1;
    });

    res.json({ data: totalPerYear });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get total resignations per quarter
exports.getTotalResignationsPerQuarter = async (req, res) => {
  try {
    const { quarter, year } = req.query;

    if (!quarter || !year) {
      return res.status(400).json({ error: "Both quarter and year must be provided." });
    }

    const startEndDates = {
      Q1: [new Date(`${year}-01-01`), new Date(`${year}-03-31T23:59:59`)],
      Q2: [new Date(`${year}-04-01`), new Date(`${year}-06-30T23:59:59`)],
      Q3: [new Date(`${year}-07-01`), new Date(`${year}-09-30T23:59:59`)],
      Q4: [new Date(`${year}-10-01`), new Date(`${year}-12-31T23:59:59`)],
    };

    const [start, end] = startEndDates[quarter.toUpperCase()] || [];
    if (!start || !end) {
      return res.status(400).json({ error: "Invalid quarter. Use Q1, Q2, Q3, or Q4." });
    }

    const count = await ExitInterview.countDocuments({
      resignation_date: { $gte: start, $lte: end }
    });

    res.json({ quarter, year, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
