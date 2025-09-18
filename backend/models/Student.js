const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true
  },
  rollNumber: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    enum: ['KG1', 'KG2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    trim: true
  },
  section: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for class and section
studentSchema.index({ class: 1, section: 1 });

// Create unique compound index to prevent duplicate roll numbers in same class/section
studentSchema.index({ rollNumber: 1, class: 1, section: 1 }, { unique: true });

// Pre-remove middleware to delete all related attendance records
studentSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Attendance = mongoose.model('Attendance');
  await Attendance.deleteMany({ student: this._id });
});

// Pre-remove middleware for findOneAndDelete
studentSchema.pre('findOneAndDelete', async function() {
  const Attendance = mongoose.model('Attendance');
  const student = await this.model.findOne(this.getQuery());
  if (student) {
    await Attendance.deleteMany({ student: student._id });
  }
});

module.exports = mongoose.model('Student', studentSchema);