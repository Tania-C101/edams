exports.normalizeAnswers = (answers) => {
  const normalized = {};
  for (const [question, value] of Object.entries(answers)) {
    normalized[question] = Number(value);
  }
  return normalized;
};
