const PerformanceReview = require("../models/PerformanceReview");
const { resolveEmployeeObjectId } = require("../utilities/employeeUtils");

// Map backend keys to human-readable names
const CATEGORY_LABELS = {
  work_qual_score: "Work Quality",
  com_score: "Communication",
  awareness_score: "Awareness",
  teamwork_score: "Teamwork",
  adaptability_score: "Adaptability",
};

// Define the 5 scoring categories in the PerformanceReview model
const CATEGORIES = [
  "work_qual_score",
  "com_score",
  "awareness_score",
  "teamwork_score",
  "adaptability_score"
];

// Category scores per employee
exports.getEmployeeCategoryTrendsForPerformanceReview = async (req, res) => {
  const { employee_ID } = req.params;

  try {
    const objectId = await resolveEmployeeObjectId(employee_ID);

    const reviews = await PerformanceReview.find({ employee_ID: objectId }).sort({ review_year: 1 });

    if (!reviews.length) {
      return res.status(200).json({
        message: `No reviews found for employee ${employee_ID}`
      });
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    const categoryTrends = {};
    CATEGORIES.forEach(cat => {
      categoryTrends[cat] = {};
    });

    // Aggregate
    reviews.forEach(review => {
      const year = review.review_year;
      if (!years.includes(year)) return;

      CATEGORIES.forEach(cat => {
        if (!categoryTrends[cat][year]) categoryTrends[cat][year] = [];
        categoryTrends[cat][year].push(Number(review[cat]) || 0);
      });
    });

    // Average
    CATEGORIES.forEach(cat => {
      years.forEach(year => {
        const arr = categoryTrends[cat][year];
        if (arr && arr.length > 0) {
          categoryTrends[cat][year] = Number(
            (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
          );
        } else {
          categoryTrends[cat][year] = null;
        }
      });
    });

    // Map keys to human-readable labels
    const humanReadableCategoryTrends = {};
    Object.keys(categoryTrends).forEach((key) => {
      const label = CATEGORY_LABELS[key] || key;
      humanReadableCategoryTrends[label] = categoryTrends[key];
    });

    // Send response
    res.json({ categoryTrends: humanReadableCategoryTrends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Total scores per employee
exports.getEmployeeYearlyTotalsForPerformanceReview = async (req, res) => {
  const { employee_ID } = req.params;

  try {
    const objectId = await resolveEmployeeObjectId(employee_ID);

    const reviews = await PerformanceReview.find({ employee_ID: objectId }).sort({ review_year: 1 });

    if (!reviews.length) {
      return res.status(200).json({
        total: {},
        message: `No reviews found for employee ${employee_ID}`
      });
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    const yearlyTotals = {};
    reviews.forEach(review => {
      const year = review.review_year;
      yearlyTotals[year] = Number(review.total_score) || 0;
    });

    // Fill missing years with null
    years.forEach(year => {
      if (yearlyTotals[year] === undefined) yearlyTotals[year] = null;
    });

    res.json({ total: yearlyTotals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Category averages for all employees
exports.getCategoryAveragesForPerformanceReview = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find();

    if (!reviews.length) {
      return res.status(200).json({
        categoryAverages: {},
        message: "No performance reviews found!"
      });
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

    // Initialize accumulator: { category: { year: [] } }
    const yearlyCategoryTotals = {};
    CATEGORIES.forEach(cat => {
      yearlyCategoryTotals[cat] = {};
      years.forEach(year => {
        yearlyCategoryTotals[cat][year] = [];
      });
    });

    // Aggregate
    reviews.forEach(review => {
      const year = review.review_year;
      if (!years.includes(year)) return;

      CATEGORIES.forEach(cat => {
        if (yearlyCategoryTotals[cat][year] !== undefined) {
          yearlyCategoryTotals[cat][year].push(Number(review[cat]) || 0);
        }
      });
    });

    // Compute averages
    const categoryAverages = {};
    CATEGORIES.forEach(cat => {
      categoryAverages[cat] = {};
      years.forEach(year => {
        const arr = yearlyCategoryTotals[cat][year];
        categoryAverages[cat][year] = arr.length
          ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2))
          : null;
      });
    });

    // Map backend keys to human-readable names
    const humanReadableCategoryAverages = {};
    Object.keys(categoryAverages).forEach((key) => {
      const label = CATEGORY_LABELS[key] || key;
      humanReadableCategoryAverages[label] = categoryAverages[key];
    });

    // Send the response
    res.json({ categoryAverages: humanReadableCategoryAverages, years });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Yearly average total score for all employees
exports.getYearlyAverageTrendForPerformanceReview = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find();

    if (!reviews.length) {
      return res.status(200).json({
        yearlyAverages: {},
        message: "No performance reviews found"
      });
    }

    const yearlyBuckets = {};
    reviews.forEach(review => {
      const year = review.review_year;
      if (!yearlyBuckets[year]) yearlyBuckets[year] = [];
      yearlyBuckets[year].push(Number(review.total_score) || 0);
    });

    const yearlyAverages = {};
    Object.keys(yearlyBuckets).forEach(year => {
      const arr = yearlyBuckets[year];
      yearlyAverages[year] = Number(
        (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
      );
    });

    res.json({ yearlyAverages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

