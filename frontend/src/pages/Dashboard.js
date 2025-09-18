import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardCheck, BarChart3, Calendar, TrendingUp, Clock, UserCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { studentsAPI, attendanceAPI } from '../utils/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [recentClasses, setRecentClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const itemsPerPage = 3;

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableClassesAndSections();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedClass, selectedSection]);

  const fetchAvailableClassesAndSections = async () => {
    try {
      const studentsResponse = await studentsAPI.getAll();
      const students = studentsResponse.data;

      // Extract unique classes and sections
      const classes = [...new Set(students.map(student => student.class))].sort();
      const sections = [...new Set(students.map(student => student.section))].sort();

      setAvailableClasses(classes);
      setAvailableSections(sections);
    } catch (error) {
      console.error('Error fetching classes and sections:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Build filter parameters
      const studentFilters = {};
      if (selectedClass) studentFilters.class = selectedClass;
      if (selectedSection) studentFilters.section = selectedSection;

      const attendanceFilters = { date: today };
      if (selectedClass) attendanceFilters.class = selectedClass;
      if (selectedSection) attendanceFilters.section = selectedSection;

      // Fetch students and today's attendance with filters
      const [studentsResponse, attendanceResponse] = await Promise.all([
        studentsAPI.getAll(studentFilters),
        attendanceAPI.getAll(attendanceFilters)
      ]);

      const totalStudents = studentsResponse.data.length;
      const todayAttendance = attendanceResponse.data;

      const presentToday = todayAttendance.filter(record => record.status === 'present' || record.status === 'late').length;
      const absentToday = todayAttendance.filter(record => record.status === 'absent').length;
      const attendanceRate = totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(1) : 0;

      setStats({
        totalStudents,
        presentToday,
        absentToday,
        attendanceRate
      });

      // Get recent classes attendance (fetch more to enable pagination)
      const recentClassesResponse = await attendanceAPI.getRecentClasses({ limit: 50 });
      setRecentClasses(recentClassesResponse.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setCurrentPage(1); // Reset pagination when filter changes
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
    setCurrentPage(1); // Reset pagination when filter changes
  };

  const clearFilters = () => {
    setSelectedClass('');
    setSelectedSection('');
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(recentClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = recentClasses.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, textColor, link, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${bgColor}`}>
              <Icon className={`h-6 w-6 ${textColor}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        <div className={`w-2 h-16 rounded-full ${color}`}></div>
      </div>
      {link && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            to={link}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center group"
          >
            View details
            <TrendingUp className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 xl:space-y-10 2xl:space-y-12">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 xl:p-8 2xl:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600 xl:text-lg 2xl:text-xl">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2 text-sm xl:text-base text-gray-500 bg-gray-50 px-4 py-2 xl:px-6 xl:py-3 rounded-lg">
            <Calendar className="h-4 w-4 xl:h-5 xl:w-5" />
            <span>{format(new Date(), 'EEEE, MMMM dd, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 xl:p-8 2xl:p-10">
        <div className="flex flex-wrap items-center sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="class-filter" className="hidden sm:inline-block text-sm font-medium text-gray-700 whitespace-nowrap">
                Class:
              </label>
              <select
                id="class-filter"
                value={selectedClass}
                onChange={handleClassChange}
                className="px-3 py-2 border border-gray-300 rounded-lg  text-sm"
              >
                <option value="">All Classes</option>
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    Class {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="section-filter" className="hidden sm:inline-block text-sm font-medium text-gray-700 whitespace-nowrap">
                Section:
              </label>
              <select
                id="section-filter"
                value={selectedSection}
                onChange={handleSectionChange}
                className="px-3 py-2 border border-gray-300 rounded-lg  text-sm"
              >
                <option value="">All Sections</option>
                {availableSections.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </select>
            </div>

            {(selectedClass || selectedSection) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {(selectedClass || selectedSection) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Showing data for:</span>
              {selectedClass && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Class {selectedClass}
                </span>
              )}
              {selectedSection && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Section {selectedSection}
                </span>
              )}
            </div>
          </div>
        )}
        {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-6 xl:gap-8 2xl:gap-10 mt-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Registered students"
          icon={Users}
          color="bg-blue-500"
          bgColor="bg-blue-50"
          textColor="text-blue-600"
          link="/students"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          subtitle="Students in attendance"
          icon={UserCheck}
          color="bg-green-500"
          bgColor="bg-green-50"
          textColor="text-green-600"
          link="/attendance"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          subtitle="Students not present"
          icon={Clock}
          color="bg-red-500"
          bgColor="bg-red-50"
          textColor="text-red-600"
          link="/attendance"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          subtitle="Today's percentage"
          icon={BarChart3}
          color="bg-purple-500"
          bgColor="bg-purple-50"
          textColor="text-purple-600"
          link="/reports"
        />
      </div>
      </div>

      

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-8 xl:gap-10 2xl:gap-12">
        {/* Quick Actions Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 xl:p-8 2xl:p-10">
          <div className="flex items-center justify-between mb-6 xl:mb-8">
            <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-semibold text-gray-900">Quick Actions</h2>
            <div className="w-2 h-8 xl:h-10 2xl:h-12 bg-primary-500 rounded-full"></div>
          </div>
          <div className="space-y-4 xl:space-y-6 2xl:space-y-8">
            <Link
              to="/students"
              className="flex items-center p-4 xl:p-6 2xl:p-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
            >
              <div className="p-2 xl:p-3 2xl:p-4 bg-blue-500 rounded-lg">
                <Users className="h-5 w-5 xl:h-6 xl:w-6 2xl:h-8 2xl:w-8 text-white" />
              </div>
              <div className="ml-4 xl:ml-6 flex-1">
                <span className="font-medium text-gray-900 xl:text-lg 2xl:text-xl">Manage Students</span>
                <p className="text-sm xl:text-base 2xl:text-lg text-gray-600">Add, edit, or view student information</p>
              </div>
              <TrendingUp className="h-5 w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7 text-blue-600 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            <Link
              to="/attendance"
              className="flex items-center p-4 xl:p-6 2xl:p-8 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 group"
            >
              <div className="p-2 xl:p-3 2xl:p-4 bg-green-500 rounded-lg">
                <ClipboardCheck className="h-5 w-5 xl:h-6 xl:w-6 2xl:h-8 2xl:w-8 text-white" />
              </div>
              <div className="ml-4 xl:ml-6 flex-1">
                <span className="font-medium text-gray-900 xl:text-lg 2xl:text-xl">Mark Attendance</span>
                <p className="text-sm xl:text-base 2xl:text-lg text-gray-600">Record daily student attendance</p>
              </div>
              <TrendingUp className="h-5 w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7 text-green-600 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            <Link
              to="/reports"
              className="flex items-center p-4 xl:p-6 2xl:p-8 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group"
            >
              <div className="p-2 xl:p-3 2xl:p-4 bg-purple-500 rounded-lg">
                <BarChart3 className="h-5 w-5 xl:h-6 xl:w-6 2xl:h-8 2xl:w-8 text-white" />
              </div>
              <div className="ml-4 xl:ml-6 flex-1">
                <span className="font-medium text-gray-900 xl:text-lg 2xl:text-xl">View Reports</span>
                <p className="text-sm xl:text-base 2xl:text-lg text-gray-600">Generate attendance analytics</p>
              </div>
              <TrendingUp className="h-5 w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7 text-purple-600 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 xl:p-8 2xl:p-10">
          <div className="flex items-center justify-between mb-6 xl:mb-8">
            <div>
              <h2 className="text-xl xl:text-2xl 2xl:text-3xl font-semibold text-gray-900">Today's Attendance</h2>
              <p className="text-sm xl:text-base text-gray-500 mt-1">Classes with attendance marked today</p>
            </div>
            <div className="w-2 h-8 xl:h-10 2xl:h-12 bg-green-500 rounded-full"></div>
          </div>

          {recentClasses.length > 0 ? (
            <>
              <div className="space-y-4 xl:space-y-5 2xl:space-y-6">
                {currentItems.map((classRecord, index) => (
                  <div key={`${classRecord._id.class}-${classRecord._id.section}-${classRecord._id.date}-${index}`} className="flex items-center justify-between p-4 xl:p-5 2xl:p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3 xl:space-x-4 2xl:space-x-5">
                      <div className="w-10 h-10 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm xl:text-base 2xl:text-lg font-medium text-primary-700">
                          {classRecord._id.class}{classRecord._id.section}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 xl:text-lg 2xl:text-xl">
                          Class {classRecord._id.class} - Section {classRecord._id.section}
                        </p>
                        <p className="text-sm xl:text-base 2xl:text-lg text-gray-500">
                          Total: {classRecord.totalStudents} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex space-x-2 mb-2">
                        <span className="inline-flex px-2 py-1 text-xs xl:text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          Present: {classRecord.presentCount}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs xl:text-sm font-semibold rounded-full bg-red-100 text-red-800">
                          Absent: {classRecord.absentCount}
                        </span>
                      </div>

                      <p className="text-xs xl:text-sm 2xl:text-base text-gray-500 mt-1">
                        {format(new Date(classRecord._id.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, recentClasses.length)} of {recentClasses.length} records
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${currentPage === page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 xl:py-16 2xl:py-20">
              <ClipboardCheck className="mx-auto h-12 w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20 text-gray-400" />
              <h3 className="mt-4 text-sm xl:text-base 2xl:text-lg font-medium text-gray-900">No recent attendance</h3>
              <p className="mt-2 text-sm xl:text-base 2xl:text-lg text-gray-500">
                Start marking attendance to see recent class records here.
              </p>
              <Link
                to="/attendance"
                className="mt-4 inline-flex items-center px-4 py-2 xl:px-6 xl:py-3 2xl:px-8 2xl:py-4 border border-transparent text-sm xl:text-base 2xl:text-lg font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 transition-colors duration-200"
              >
                Mark Attendance
              </Link>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default Dashboard;