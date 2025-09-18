import React, { useState, useEffect } from 'react';
import { Calendar, Download, BarChart3, TrendingUp } from 'lucide-react';
import { attendanceAPI, studentsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    class: '',
    section: ''
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate
      };
      
      if (filters.class) params.class = filters.class;
      if (filters.section) params.section = filters.section;

      const response = await attendanceAPI.getReport(params);
      // Sort report data by roll number in ascending order
      const sortedReportData = response.data.sort((a, b) => {
        const rollA = parseInt(a.studentInfo.rollNumber) || 0;
        const rollB = parseInt(b.studentInfo.rollNumber) || 0;
        return rollA - rollB;
      });
      setReportData(sortedReportData);
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Name',
      'Class',
      'Section',
      'Roll Number',
      'Total Days',
      'Present Days',
      'Absent Days',
      'Late Days',
      'Attendance %'
    ];

    const csvData = reportData.map(record => [
      `${record.studentInfo.firstName} ${record.studentInfo.lastName || ''}`,
      record.studentInfo.class,
      record.studentInfo.section,
      record.studentInfo.rollNumber,
      record.totalDays,
      record.presentDays,
      record.absentDays,
      record.lateDays,
      record.attendancePercentage.toFixed(2)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${filters.startDate}_to_${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Report exported successfully');
  };

  const getOverallStats = () => {
    if (reportData.length === 0) return { avgAttendance: 0, totalStudents: 0, highPerformers: 0, lowPerformers: 0 };

    const totalStudents = reportData.length;
    const avgAttendance = reportData.reduce((sum, record) => sum + record.attendancePercentage, 0) / totalStudents;
    const highPerformers = reportData.filter(record => record.attendancePercentage >= 90).length;
    const lowPerformers = reportData.filter(record => record.attendancePercentage < 75).length;

    return { avgAttendance, totalStudents, highPerformers, lowPerformers };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
        <button
          onClick={exportToCSV}
          disabled={reportData.length === 0}
          className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="input-field"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="input-field"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              className="input-field"
              value={filters.class}
              onChange={(e) => handleFilterChange('class', e.target.value)}
            >
              <option value="">All Classes</option>
              <option value="KG1">KG1</option>
              <option value="KG2">KG2</option>
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
              <option value="5">Class 5</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              className="input-field"
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
              <option value="E">Section E</option>
              <option value="F">Section F</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgAttendance.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Performers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.highPerformers}</p>
              <p className="text-xs text-gray-500">≥90% attendance</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Performers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowPerformers}</p>
              <p className="text-xs text-gray-500">&lt;75% attendance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Attendance Report ({reportData.length} students)
          </h3>
          <div className="text-sm text-gray-500">
            Period: {format(new Date(filters.startDate), 'MMM dd, yyyy')} - {format(new Date(filters.endDate), 'MMM dd, yyyy')}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class/Section
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Days
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.studentInfo.firstName} {record.studentInfo.lastName || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          Roll: {record.studentInfo.rollNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.studentInfo.class} - {record.studentInfo.section}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{record.totalDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-green-600 font-medium">{record.presentDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-red-600 font-medium">{record.absentDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-yellow-600 font-medium">{record.lateDays}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <div className={`text-sm font-medium ${
                          record.attendancePercentage >= 90 ? 'text-green-600' :
                          record.attendancePercentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {record.attendancePercentage.toFixed(1)}%
                        </div>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          record.attendancePercentage >= 90 ? 'bg-green-400' :
                          record.attendancePercentage >= 75 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your date range or filters to see attendance data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;