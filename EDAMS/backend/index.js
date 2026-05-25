const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');

// Environment variables
const uri = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

const app = express();

// Middleware
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(cors());
app.use(express.json());

// Resgiter/ mount all routes in here
const authRoute = require('./routes/authRoute');
app.use('/api/auth', authRoute);

const employeeRoute = require('./routes/employeeRoutes');
app.use('/api/employee', employeeRoute);

const exitInterviewRoute = require('./routes/exitInterviewRoutes');
app.use('/api/exit-interview', exitInterviewRoute);

const passwordRecoveryRoute = require('./routes/passwordRecoveryRoutes');
app.use('/api/password-recovery', passwordRecoveryRoute);

const performanceReviewRoute = require('./routes/performanceReviewRoutes');
app.use('/api/performance-review', performanceReviewRoute);

const questionResponseRoute = require('./routes/questionResponseRoutes');
app.use('/api/question-response', questionResponseRoute);

const selfEvaluationRoute = require('./routes/selfEvaluationRoutes');
app.use('/api/self-evaluation', selfEvaluationRoute);

const surveyNotificationRoute = require('./routes/surveyNotificationRoutes');
app.use('/api/survey-notification', surveyNotificationRoute);

const surveyRoute = require('./routes/surveyRoutes');
app.use('/api/survey-dashboard', surveyRoute);

const performanceRoute = require('./routes/performanceRoutes');
app.use('/api/performance-dashboard', performanceRoute);

const surveySubmissionRoute = require('./routes/surveySubmissionRoutes');
app.use('/api/survey-submission', surveySubmissionRoute);

const userAccountRoute = require('./routes/userAccountRoutes');
app.use('/api/user-account', userAccountRoute);

const surveyAnalyticsRoute = require('./routes/surveyAnalyticsRoutes');
app.use('/api/survey-analytics', surveyAnalyticsRoute);

const performanceReviewAnalyticsRoute = require('./routes/performanceReviewAnalyticsRoutes');
app.use('/api/performance-review-analytics', performanceReviewAnalyticsRoute);

const exitInterviewAnalyticsRoute = require('./routes/exitInterviewAnalyticsRoutes');
app.use('/api/exit-interview-analytics', exitInterviewAnalyticsRoute);

const predictiveAttritionRoute = require("./routes/predictiveAttritionRoutes");
app.use("/api/attrition", predictiveAttritionRoute);

// MongoDB connection
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.once('open', () => {
  console.log('MongoDB connected successfully!');

  const predictionCollection = db.collection('employee_attrition_predictions');

  // Socket.io setup for real-time updates
  const server = http.createServer(app);
  const io = socketio(server, { cors: { origin: '*' } });

  // Emit new prediction events
  const changeStream = predictionCollection.watch();
  changeStream.on('change', (change) => {
    if (change.operationType === 'insert' || change.operationType === 'update') {
      io.emit('new_prediction', change.fullDocument);
    }
  });

  // Start server
  server.listen(PORT, () => console.log(`Server + Socket.io running on port ${PORT}`));
});

db.on('error', (err) => console.error('MongoDB connection error:', err));