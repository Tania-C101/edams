const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);

// Environment
const uri = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(cors({
  origin: "*", // change later to your S3 URL
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/employee', require('./routes/employeeRoutes'));
app.use('/api/exit-interview', require('./routes/exitInterviewRoutes'));
app.use('/api/password-recovery', require('./routes/passwordRecoveryRoutes'));
app.use('/api/performance-review', require('./routes/performanceReviewRoutes'));
app.use('/api/question-response', require('./routes/questionResponseRoutes'));
app.use('/api/self-evaluation', require('./routes/selfEvaluationRoutes'));
app.use('/api/survey-notification', require('./routes/surveyNotificationRoutes'));
app.use('/api/survey-dashboard', require('./routes/surveyRoutes'));
app.use('/api/performance-dashboard', require('./routes/performanceRoutes'));
app.use('/api/survey-submission', require('./routes/surveySubmissionRoutes'));
app.use('/api/user-account', require('./routes/userAccountRoutes'));
app.use('/api/survey-analytics', require('./routes/surveyAnalyticsRoutes'));
app.use('/api/performance-review-analytics', require('./routes/performanceReviewAnalyticsRoutes'));
app.use('/api/exit-interview-analytics', require('./routes/exitInterviewAnalyticsRoutes'));
app.use('/api/attrition', require('./routes/predictiveAttritionRoutes'));

// Socket setup (outside DB)
const io = socketio(server, {
  cors: {
    origin: "*"
  }
});

// MongoDB
mongoose.connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Change stream (safe after connection)
mongoose.connection.once('open', () => {
  const db = mongoose.connection;
  const predictionCollection = db.collection('employee_attrition_predictions');

  const changeStream = predictionCollection.watch();

  changeStream.on('change', (change) => {
    if (change.operationType === 'insert' || change.operationType === 'update') {
      io.emit('new_prediction', change.fullDocument);
    }
  });
});

// Start server ALWAYS
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});