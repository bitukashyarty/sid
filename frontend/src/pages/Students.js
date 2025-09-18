import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Upload, Download } from 'lucide-react';
import { studentsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    class: '',
    section: ''
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    class: '',
    section: '',
    rollNumber: ''
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent._id, formData);
        toast.success('Student updated successfully');
      } else {
        await studentsAPI.create(formData);
        toast.success('Student added successfully');
      }
      
      fetchStudents();
      resetForm();
      setShowModal(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName || '',
      class: student.class,
      section: student.section,
      rollNumber: student.rollNumber
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentsAPI.delete(id);
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      class: '',
      section: '',
      rollNumber: ''
    });
    setEditingStudent(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await studentsAPI.downloadSampleTemplate();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'students_bulk_upload_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        setUploadFile(file);
        setUploadResults(null);
      } else {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        e.target.value = '';
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await studentsAPI.bulkUpload(formData);
      setUploadResults(response.data.results);
      
      if (response.data.results.success.length > 0) {
        toast.success(response.data.message);
        fetchStudents(); // Refresh the students list
      } else {
        toast.error('No students were added. Please check the errors below.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Bulk upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const resetBulkUpload = () => {
    setUploadFile(null);
    setUploadResults(null);
    setShowBulkUpload(false);
    // Reset file input
    const fileInput = document.getElementById('bulk-upload-file');
    if (fileInput) fileInput.value = '';
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.lastName && student.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = !filters.class || student.class === filters.class;
    const matchesSection = !filters.section || student.section === filters.section;
    
    return matchesSearch && matchesClass && matchesSection;
  }).sort((a, b) => {
    // Ensure filtered results are also sorted by roll number
    const rollA = parseInt(a.rollNumber) || 0;
    const rollB = parseInt(b.rollNumber) || 0;
    return rollA - rollB;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
          <div className="text-sm text-gray-500 flex items-center">
            Total: {filteredStudents.length} students
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class/Section
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.rollNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.class} - {student.section}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingStudent ? 'Edit Student' : 'Add Students'}
                </h3>
                
                {/* Tabs - only show for new students, not editing */}
                {!editingStudent && (
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        type="button"
                        onClick={() => setShowBulkUpload(false)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          !showBulkUpload
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Individual Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBulkUpload(true)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          showBulkUpload
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Upload className="h-4 w-4 inline mr-1" />
                        Bulk Upload
                      </button>
                    </nav>
                  </div>
                )}

                {/* Individual Entry Form */}
                {(!showBulkUpload || editingStudent) && (
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Roll Number *
                        </label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          value={formData.rollNumber}
                          onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Class *
                        </label>
                        <select
                          required
                          className="input-field"
                          value={formData.class}
                          onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                        >
                          <option value="">Select Class</option>
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
                          Section *
                        </label>
                        <select
                          required
                          className="input-field"
                          value={formData.section}
                          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        >
                          <option value="">Select Section</option>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                          <option value="D">Section D</option>
                          <option value="E">Section E</option>
                          <option value="F">Section F</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                      >
                        {editingStudent ? 'Update' : 'Add'} Student
                      </button>
                    </div>
                  </form>
                )}

                {/* Bulk Upload Form */}
                {showBulkUpload && !editingStudent && (
                  <div className="space-y-6">
                    {/* Download Template */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Download className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blue-900">Download Template</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Download the Excel template with the correct format and sample data.
                          </p>
                          <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Download Template
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Excel File *
                      </label>
                      <input
                        id="bulk-upload-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {uploadFile && (
                        <p className="mt-2 text-sm text-green-600">
                          Selected: {uploadFile.name}
                        </p>
                      )}
                    </div>

                    {/* Upload Results */}
                    {uploadResults && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Results</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{uploadResults.total}</div>
                              <div className="text-gray-600">Total Rows</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{uploadResults.success.length}</div>
                              <div className="text-gray-600">Success</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">{uploadResults.errors.length}</div>
                              <div className="text-gray-600">Errors</div>
                            </div>
                          </div>
                        </div>

                        {/* Success List */}
                        {uploadResults.success.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-green-900 mb-2">Successfully Added Students:</h5>
                            <div className="max-h-32 overflow-y-auto">
                              {uploadResults.success.map((item, index) => (
                                <div key={index} className="text-sm text-green-700">
                                  Row {item.row}: {item.student}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Error List */}
                        {uploadResults.errors.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-red-900 mb-2">Errors:</h5>
                            <div className="max-h-32 overflow-y-auto">
                              {uploadResults.errors.map((item, index) => (
                                <div key={index} className="text-sm text-red-700">
                                  Row {item.row}: {item.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          resetBulkUpload();
                          setShowModal(false);
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkUpload}
                        disabled={!uploadFile || uploading}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? 'Uploading...' : 'Upload Students'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;