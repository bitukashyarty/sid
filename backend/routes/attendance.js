const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { date, class: className, section, studentId } = req.query;
    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (studentId) {
      query.student = studentId;
    }

    let attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId class section rollNumber')
      .populate('markedBy', 'username')
      .sort({ date: -1 });

    // Filter by class and section if provided
    if (className || section) {
      attendance = attendance.filter(record => {
        if (className && record.student.class !== className) return false;
        if (section && record.student.section !== section) return false;
        return true;
      });
    }

    res.json(attendance);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/attendance
// @desc    Mark attendance
// @access  Private
router.post('/', [
  auth,
  body('student').notEmpty().withMessage('Student ID is required'),
  body('status').isIn(['present', 'absent', 'late']).withMessage('Valid status is required'),
  body('date').optional().isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student, status, remarks, date } = req.body;
    const attendanceDate = date ? new Date(date) : new Date();

    // Check if student exists
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if attendance already marked for this date
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAttendance = await Attendance.findOne({
      student,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.remarks = remarks;
      existingAttendance.markedBy = req.admin._id;
      await existingAttendance.save();
      
      const updatedAttendance = await Attendance.findById(existingAttendance._id)
        .populate('student', 'firstName lastName studentId class section rollNumber')
        .populate('markedBy', 'username');
      
      return res.json(updatedAttendance);
    }

    // Create new attendance record
    const attendance = new Attendance({
      student,
      status,
      remarks,
      date: attendanceDate,
      markedBy: req.admin._id
    });

    await attendance.save();
    
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student', 'firstName lastName studentId class section rollNumber')
      .populate('markedBy', 'username');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/attendance/bulk
// @desc    Mark bulk attendance
// @access  Private
router.post('/bulk', [
  auth,
  body('attendanceData').isArray().withMessage('Attendance data must be an array'),
  body('date').optional().isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { attendanceData, date } = req.body;
    const attendanceDate = date ? new Date(date) : new Date();
    const results = [];

    for (const data of attendanceData) {
      try {
        const { student, status, remarks } = data;

        // Create separate date objects to avoid mutation
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          student,
          date: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        });

        if (existingAttendance) {
          existingAttendance.status = status;
          existingAttendance.remarks = remarks;
          existingAttendance.markedBy = req.admin._id;
          await existingAttendance.save();
          results.push(existingAttendance);
        } else {
          const attendance = new Attendance({
            student,
            status,
            remarks,
            date: attendanceDate,
            markedBy: req.admin._id
          });
          await attendance.save();
          results.push(attendance);
        }
      } catch (error) {
        console.error(`Error processing attendance for student ${data.student}:`, error);
      }
    }

    res.json({ message: 'Bulk attendance marked successfully', count: results.length });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/attendance/recent-classes
// @desc    Get today's attendance grouped by class and section
// @access  Private
router.get('/recent-classes', auth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // First, let's check if we have any attendance records for today
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (todayAttendance === 0) {
      return res.json([]);
    }
    
    const pipeline = [
      // Filter for today's attendance only
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $group: {
          _id: {
            class: '$studentInfo.class',
            section: '$studentInfo.section',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date'
              }
            }
          },
          totalStudents: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $or: [{ $eq: ['$status', 'present'] }, { $eq: ['$status', 'late'] }] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          latestDate: { $max: '$date' }
        }
      },
      {
        $addFields: {
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentCount', '$totalStudents'] },
              100
            ]
          }
        }
      },
      { $sort: { '_id.class': 1, '_id.section': 1 } },
      { $limit: parseInt(limit) }
    ];

    const recentClasses = await Attendance.aggregate(pipeline);
    res.json(recentClasses);
  } catch (error) {
    console.error('Error in recent-classes endpoint:', error.message);
    console.error('Full error:', error);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/attendance/report
// @desc    Get attendance report
// @access  Private
router.get('/report', auth, async (req, res) => {
  try {
    const { startDate, endDate, class: className, section } = req.query;
    
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $group: {
          _id: '$student',
          studentInfo: { $first: '$studentInfo' },
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $or: [{ $eq: ['$status', 'present'] }, { $eq: ['$status', 'late'] }] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { 'studentInfo.class': 1, 'studentInfo.section': 1, 'studentInfo.rollNumber': 1 } }
    ];

    let report = await Attendance.aggregate(pipeline);

    // Filter by class and section if provided
    if (className || section) {
      report = report.filter(record => {
        if (className && record.studentInfo.class !== className) return false;
        if (section && record.studentInfo.section !== section) return false;
        return true;
      });
    }

    res.json(report);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;