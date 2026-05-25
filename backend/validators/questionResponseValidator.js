const questionResponseValidator = (data) => {
  const errors = [];

  // Question Type
  const validTypes = ["closed", "opened"];
  if (!data.question_type) {
    errors.push("Question type is required!");
  } else if (!validTypes.includes(data.question_type)) {
    errors.push("Question type must be either closed or opened!");
  }

  // Section Title
  if (!data.section_title || typeof data.section_title !== "string" || data.section_title.trim() === "") {
    errors.push("Section title is required and must be a string!");
  }

  // Question Index
  if (data.question_index === undefined || data.question_index === null) {
    errors.push("Question index is required!");
  } else if (!Number.isInteger(data.question_index) || data.question_index < 0) {
    errors.push("Question index must be a non-negative integer!");
  }

  // Question Text
  if (!data.question_text || typeof data.question_text !== "string" || data.question_text.trim() === "") {
    errors.push("Question text is required and must be a string!");
  }

  // Answer Value
  if (data.answer_value === undefined || data.answer_value === null || data.answer_value === "") {
    errors.push("Answer value is required!");
  } else {
    if (data.question_type === "closed") {
      if (isNaN(Number(data.answer_value))) {
        errors.push("For closed questions, answer must be a number (ex. rating)!");
      }
    }

    if (data.question_type === "opened") {
      if (typeof data.answer_value !== "string") {
        errors.push("For opened questions, answer must be a text!");
      }
    }
  }

  // Submission ID — optional 
  const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  if (data.submission_ID) {
    if (!isObjectId(data.submission_ID.toString())) {
      errors.push("Submission ID must be a valid MongoDB ObjectId!");
    }
  }

  return errors;
};

module.exports = { questionResponseValidator };