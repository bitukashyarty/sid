# Student Attendance Management System

A comprehensive MERN stack application for managing student attendance in schools. Features include admin authentication, student management, attendance tracking, and detailed reporting.

## Features

### 🔐 Authentication
- Secure admin login with JWT tokens
- Protected routes and API endpoints
- Session management

### 👥 Student Management
- Add, edit, and delete students
- Comprehensive student profiles with personal and parent information
- Search and filter functionality by class, section, and name
- Bulk operations support

### 📊 Attendance Tracking
- Daily attendance marking with Present/Absent/Late status
- Bulk attendance marking for entire classes
- Date-wise attendance management
- Real-time statistics and progress tracking

### 📈 Reports & Analytics
- Detailed attendance reports with date range filtering
- Export functionality to CSV format
- Student-wise attendance percentage calculation
- Class and section-wise analytics
- Performance indicators (high/low performers)

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Clean and intuitive interface
- Mobile-friendly layout
- Real-time notifications with toast messages

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icon library
- **date-fns** - Date manipulation

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   The `.env` file is already configured with your MongoDB credentials:
   ```
   MONGODB_URI=mongodb+srv://sidma:Itsmesid@sid.06flftp.mongodb.net/attendance_system?retryWrites=true&w=majority&appName=sid
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   PORT=5000
   NODE_ENV=development
   ```

4. **Seed Admin User:**
   ```bash
   npm run seed
   ```
   This creates an admin user with:
   - Username: `admin`
   - Password: `admin@123`

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   Application will open at http://localhost:3000

## Usage Guide

### 1. Login
- Open http://localhost:3000
- Use credentials: `admin` / `admin@123`

### 2. Student Management
- Navigate to "Students" section
- Add new students with complete information
- Edit or delete existing students
- Use search and filters to find specific students

### 3. Mark Attendance
- Go to "Attendance" section
- Select date (defaults to today)
- Filter by class/section if needed
- Mark attendance as Present/Absent/Late
- Add remarks if necessary
- Save attendance for all students

### 4. View Reports
- Access "Reports" section
- Set date range for the report
- Filter by class/section
- View attendance statistics
- Export data to CSV format

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin info

### Students
- `GET /api/students` - Get all students (with filters)
- `POST /api/students` - Add new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student (soft delete)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark single attendance
- `POST /api/attendance/bulk` - Mark bulk attendance
- `GET /api/attendance/report` - Get attendance report

## Database Schema

### Admin Collection
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: String (default: 'admin'),
  timestamps: true
}
```

### Student Collection
```javascript
{
  studentId: String (unique),
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  class: String,
  section: String,
  rollNumber: String,
  dateOfBirth: Date,
  address: String,
  parentName: String,
  parentPhone: String,
  isActive: Boolean (default: true),
  timestamps: true
}
```

### Attendance Collection
```javascript
{
  student: ObjectId (ref: Student),
  date: Date,
  status: String (enum: ['present', 'absent', 'late']),
  remarks: String,
  markedBy: ObjectId (ref: Admin),
  timestamps: true
}
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## Production Deployment

### Backend Deployment
1. Set production environment variables
2. Update JWT_SECRET to a strong secret key
3. Configure MongoDB connection for production
4. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy to platforms like Netlify, Vercel, or AWS S3
3. Update API base URL for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository or contact the development team.

---

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin@123`

**Note:** Remember to change the default admin password and JWT secret in production!