import mongoose from 'mongoose';

// -----------------------
// PomodoroLog Schema
// -----------------------
export const PomodoroLogSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Task',
  },
  user_id: {
    type: String, // Changed from ObjectId to String
    required: true,
    // Removed ref: 'User' since user_id is now a string from Clerk
  },
  start_time: {
    type: Date,
    required: true,
  },
  end_time: {
    type: Date,
    required: true,
  },
  session_status: {
    type: String,
    enum: ['pomodoro', 'short-break', 'long-break'],
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const PomodoroLog = mongoose.model('PomodoroLog', PomodoroLogSchema);

// -----------------------
// SessionSettings Schema
// -----------------------
export const SessionSettingsSchema = new mongoose.Schema({
  user_id: {
    type: String, // Changed from ObjectId to String
    required: true,
    // Removed ref: 'User' since user_id is now a string from Clerk
    unique: true, // Assuming each user has one settings document
  },
  default_work_time: {
    type: Number,
    required: true,
  },
  default_break_time: {
    type: Number,
    required: true,
  },
  long_break_time: {
    type: Number,
    required: true,
  },
  cycles_per_set: {
    type: Number,
    required: true,
  },
});

const SessionSettings = mongoose.model('SessionSettings', SessionSettingsSchema);

// -----------------------
// CurrentPomodoro Schema
// -----------------------
export const CurrentPomodoroSchema = new mongoose.Schema({
  user_id: {
    type: String, // Changed from ObjectId to String
    required: true,
    // Removed ref: 'User' since user_id is now a string from Clerk
    unique: true, // Assuming each user has one current pomodoro document
  },
  current_pomodoro_number: {
    type: Number,
    required: true,
    default: 0,
  },
  cycles_completed: {
    type: Number,
    required: true,
    default: 0,
  },
  total_break_time: {
    type: Number, // seconds
    required: true,
    default: 0,
  },
  number_sessions: {
    type: Number,
    required: true,
    default: 0,
  },
});

const CurrentPomodoro = mongoose.model('CurrentPomodoro', CurrentPomodoroSchema);

// -----------------------
// PomodoroDetails Schema
// -----------------------
export const PomodoroDetailsSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Task',
  },
  start_time: {
    type: Date,
    required: true,
  },
  end_time: {
    type: Date,
    required: true,
  },
  // Optionally, you can add user_id here if you need to reference the user
  user_id: {
    type: String, // Changed from ObjectId to String
    required: true,
    // Removed ref: 'User' since user_id is now a string from Clerk
  },
});

const PomodoroDetails = mongoose.model('PomodoroDetails', PomodoroDetailsSchema);

// -----------------------
// Exporting Models
// -----------------------
export { PomodoroLog, SessionSettings, CurrentPomodoro, PomodoroDetails };
