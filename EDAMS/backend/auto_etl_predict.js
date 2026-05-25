// auto_etl_predict.js
require("dotenv").config();
const mongoose = require("mongoose");
const { spawn } = require("child_process");
const path = require("path");

// MongoDB connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI not found in .env file");
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", (err) => console.error("MongoDB connection error:", err));

db.once("open", () => {
  console.log("Connected to MongoDB. Watching survey submissions...");

  // Watch for inserts in 'surveysubmissions' collection
  const submissionCollection = db.collection("surveysubmissions");
  const changeStream = submissionCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      console.log(`[${new Date().toISOString()}] New survey submission detected. Triggering ETL + prediction...`);

      // Absolute paths to Python scripts
      const etlScript = path.join(__dirname, "etl_features.py");
      const predictScript = path.join(__dirname, "predict_attrition.py");

      // Run Python ETL
      const etlProcess = spawn("python", [etlScript]);

      etlProcess.stdout.on("data", (data) => {
        process.stdout.write(`[ETL] ${data}`);
      });

      etlProcess.stderr.on("data", (data) => {
        process.stderr.write(`[ETL ERROR] ${data}`);
      });

      etlProcess.on("close", (code) => {
        console.log(`[${new Date().toISOString()}] ETL finished with code ${code}`);

        if (code === 0) {
          // Run attrition prediction
          const predictProcess = spawn("python", [predictScript]);

          predictProcess.stdout.on("data", (data) => process.stdout.write(`[Prediction] ${data}`));
          predictProcess.stderr.on("data", (data) => process.stderr.write(`[Prediction ERROR] ${data}`));

          predictProcess.on("close", (code) => {
            console.log(`[${new Date().toISOString()}] Prediction finished with code ${code}`);
          });
        } else {
          console.error("ETL failed, skipping prediction.");
        }
      });
    }
  });

  console.log("Watching for new survey submissions...");
});
