const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');

// Load environment variables
dotenv.config();

const seedStudents = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if students already exist
    const existingStudents = await Student.countDocuments();
    if (existingStudents > 0) {
      console.log(`${existingStudents} students already exist in database`);
      process.exit(0);
    }

    // Create sample students
    const students = [
      {
        firstName: 'John',
        lastName: 'Doe',
        studentId: 'STU001',
        rollNumber: '001',
        class: '10',
        section: 'A',
        dateOfBirth: new Date('2008-05-15'),
        gender: 'male',
        contactNumber: '1234567890',
        email: 'john.doe@example.com',
        address: '123 Main St, City'
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        studentId: 'STU002',
        rollNumber: '002',
        class: '10',
        section: 'A',
        dateOfBirth: new Date('2008-08-22'),
        gender: 'female',
        contactNumber: '1234567891',
        email: 'jane.smith@example.com',
        address: '456 Oak Ave, City'
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        studentId: 'STU003',
        rollNumber: '003',
        class: '10',
        section: 'B',
        dateOfBirth: new Date('2008-03-10'),
        gender: 'male',
        contactNumber: '1234567892',
        email: 'mike.johnson@example.com',
        address: '789 Pine St, City'
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        studentId: 'STU004',
        rollNumber: '004',
        class: '10',
        section: 'B',
        dateOfBirth: new Date('2008-11-05'),
        gender: 'female',
        contactNumber: '1234567893',
        email: 'sarah.wilson@example.com',
        address: '321 Elm St, City'
      },
      {
        firstName: 'Alex',
        lastName: 'Brown',
        studentId: 'STU005',
        rollNumber: '005',
        class: '9',
        section: 'A',
        dateOfBirth: new Date('2009-01-18'),
        gender: 'male',
        contactNumber: '1234567894',
        email: 'alex.brown@example.com',
        address: '654 Maple Ave, City'
      }
    ];

    await Student.insertMany(students);
    console.log(`${students.length} sample students created successfully`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding students:', error.message);
    process.exit(1);
  }
};

seedStudents();