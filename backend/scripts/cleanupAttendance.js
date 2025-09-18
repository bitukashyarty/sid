const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// Load environment variables
dotenv.config();

const cleanupAttendance = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove all attendance records for today to start fresh
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const deletedCount = await Attendance.deleteMany({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    console.log(`Deleted ${deletedCount.deletedCount} attendance records for today`);

    // Fix students with null studentId
    const studentsWithNullId = await Student.find({ studentId: null });
    console.log(`Found ${studentsWithNullId.length} students with null studentId`);

    for (let i = 0; i < studentsWithNullId.length; i++) {
      const student = studentsWithNullId[i];
      const newStudentId = `STU${String(Date.now() + i).slice(-6)}`;
      student.studentId = newStudentId;
      await student.save();
      console.log(`Updated student ${student.firstName} ${student.lastName} with studentId: ${newStudentId}`);
    }

    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
};

cleanupAttendance();