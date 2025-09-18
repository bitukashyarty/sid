const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const xlsx = require('xlsx');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @route   GET /api/students/sample-template
// @desc    Download sample Excel template for bulk upload
// @access  Private
router.get('/sample-template', auth, (req, res) => {
  try {
    // Create sample data
    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Roll Number': '001',
        'Class': '1',
        'Section': 'A'
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Roll Number': '002',
        'Class': '1',
        'Section': 'A'
      }
    ];

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(sampleData);

    // Add some styling and validation info
    const range = xlsx.utils.decode_range(ws['!ref']);
    
    // Add header row styling
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = xlsx.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFFFAA00" } }
      };
    }

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, 'Students');

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=students_bulk_upload_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buffer);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/students/bulk-upload
// @desc    Bulk upload students from Excel file
// @access  Private
router.post('/bulk-upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = {
      success: [],
      errors: [],
      total: data.length
    };

    // Validate and process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Validate required fields
        const firstName = row['First Name']?.toString().trim();
        const lastName = row['Last Name']?.toString().trim() || '';
        const rollNumber = row['Roll Number']?.toString().trim();
        const className = row['Class']?.toString().trim();
        const section = row['Section']?.toString().trim().toUpperCase();

        if (!firstName) {
          results.errors.push({ row: rowNumber, error: 'First Name is required' });
          continue;
        }

        if (!rollNumber) {
          results.errors.push({ row: rowNumber, error: 'Roll Number is required' });
          continue;
        }

        if (!className || !['KG1', 'KG2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].includes(className)) {
          results.errors.push({ row: rowNumber, error: 'Valid Class is required (KG1, KG2, 1-12)' });
          continue;
        }

        if (!section || !['A', 'B', 'C', 'D', 'E', 'F'].includes(section)) {
          results.errors.push({ row: rowNumber, error: 'Valid Section is required (A-F)' });
          continue;
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({
          class: className,
          section: section,
          rollNumber: rollNumber,
          isActive: true
        });

        if (existingStudent) {
          results.errors.push({ 
            row: rowNumber, 
            error: `Student with roll number ${rollNumber} already exists in ${className}-${section}` 
          });
          continue;
        }

        // Create new student
        const student = new Student({
          firstName,
          lastName,
          class: className,
          section,
          rollNumber
        });

        await student.save();
        results.success.push({
          row: rowNumber,
          student: `${firstName} ${lastName} (${rollNumber}) - ${className}-${section}`
        });

      } catch (error) {
        results.errors.push({ 
          row: rowNumber, 
          error: error.message || 'Failed to create student' 
        });
      }
    }

    res.json({
      message: `Bulk upload completed. ${results.success.length} students added, ${results.errors.length} errors.`,
      results
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error during bulk upload' });
  }
});

// @route   GET /api/students
// @desc    Get all students
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { class: className, section, search } = req.query;
    let query = { isActive: true };

    if (className) query.class = className;
    if (section) query.section = section;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).sort({ class: 1, section: 1, rollNumber: 1 });
    res.json(students);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/students
// @desc    Add new student
// @access  Private
router.post('/', [
  auth,
  body('firstName').notEmpty().withMessage('First name is required'),
  body('class').isIn(['KG1', 'KG2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).withMessage('Valid class is required'),
  body('section').isIn(['A', 'B', 'C', 'D', 'E', 'F']).withMessage('Valid section is required'),
  body('rollNumber').notEmpty().withMessage('Roll number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, class: className, section, rollNumber } = req.body;

    // Check if student already exists with same roll number in same class and section
    const existingStudent = await Student.findOne({
      class: className,
      section: section,
      rollNumber: rollNumber,
      isActive: true
    });

    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this roll number already exists in this class and section' });
    }

    const student = new Student({
      firstName,
      lastName: lastName || '',
      class: className,
      section,
      rollNumber
    });

    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student (hard delete with cascade)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Delete the student - this will trigger the pre-remove middleware
    // to delete all related attendance records
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student and all related data deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;