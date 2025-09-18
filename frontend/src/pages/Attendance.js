import React, { useState, useEffect } from 'react';
import { Calendar, Save, Users, Filter } from 'lucide-react';
import { studentsAPI, attendanceAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filters, setFilters] = useState({
    class: '',
    section: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, students]);

  const fetchStudents = async () => {
    try {
      const params = {};
      if (filters.class) params.class = filters.class;
      if (filters.section) params.section = filters.section;
      
      const response = await studentsAPI.getAll(params);
      // Sort students by roll number in ascending order
      const sortedStudents = response.data.sort((a, b) => {
        const rollA = parseInt(a.rollNumber) || 0;
        const rollB = parseInt(b.rollNumber) || 0;
        return rollA - rollB;
      });
      setStudents(sortedStudents);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await attendanceAPI.getAll({ date: selectedDate });
      const attendanceMap = {};
      
      response.data.forEach(record => {
        attendanceMap[record.student._id] = {
          status: record.status,
          remarks: record.remarks || ''
        };
      });
      
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceData = Object.entries(attendance).map(([studentId, data]) => ({
        student: studentId,
        status: data.status || 'absent',
        remarks: data.remarks || '',
        date: selectedDate
      }));

      await attendanceAPI.markBulk({ attendanceData, date: selectedDate });
      toast.success('Attendance saved successfully');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAll = (status) => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student._id] = {
        status,
        remarks: attendance[student._id]?.remarks || ''
      };
    });
    setAttendance(newAttendance);
  };

  const getAttendanceStats = () => {
    const total = students.length;
    
    // Count only for the current filtered students
    let presentOnly = 0;
    let late = 0;
    let absent = 0;
    let unmarked = 0;
    
    students.forEach(student => {
      const studentAttendance = attendance[student._id];
      if (!studentAttendance || !studentAttendance.status) {
        unmarked++;
      } else {
        switch (studentAttendance.status) {
          case 'present':
            presentOnly++;
            break;
          case 'late':
            late++;
            break;
          case 'absent':
            absent++;
            break;
          default:
            unmarked++;
        }
      }
    });
    
    const present = presentOnly + late; // Late students count as present
    
    return { total, present, absent, late, unmarked };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="btn-primary flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                className="input-field"
                value={filters.class}
                onChange={(e) => setFilters({ ...filters, class: e.target.value })}
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
                onChange={(e) => setFilters({ ...filters, section: e.target.value })}
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
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="w-full btn-primary bg-green-600 hover:bg-green-700"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('absent')}
              className="w-full btn-danger"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Students:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Present (incl. Late):</span>
              <span className="font-medium text-green-600">{stats.present}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Absent:</span>
              <span className="font-medium text-red-600">{stats.absent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">Late:</span>
              <span className="font-medium text-yellow-600">{stats.late}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unmarked:</span>
              <span className="font-medium text-gray-600">{stats.unmarked}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Students ({students.length})
          </h3>
          <div className="text-sm text-gray-500">
            Date: {format(new Date(selectedDate), 'MMMM dd, yyyy')}
          </div>
        </div>

        {students.length > 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          Roll: {student.rollNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.class} - {student.section}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {['present', 'absent', 'late'].map((status) => (
                          <label key={status} className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${student._id}`}
                              value={status}
                              checked={attendance[student._id]?.status === status}
                              onChange={(e) => handleAttendanceChange(student._id, 'status', e.target.value)}
                              className="mr-1"
                            />
                            <span className={`text-sm capitalize ${
                              status === 'present' ? 'text-green-600' :
                              status === 'absent' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {status}
                            </span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        placeholder="Add remarks..."
                        className="input-field text-sm"
                        value={attendance[student._id]?.remarks || ''}
                        onChange={(e) => handleAttendanceChange(student._id, 'remarks', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or add some students first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;