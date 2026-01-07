import React, { useState, useEffect } from "react";
import { getCourses, addCourse, updateCourse, getDepartments, getFaculty, getRooms } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  BookOpen, 
  Search, 
  ChevronRight, 
  User, 
  Calendar, 
  Building2,
  AlertTriangle,
  CheckCircle,
  X,
  Clock,
  MapPin
} from "lucide-react";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Selection state
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showCourses, setShowCourses] = useState(false);

  // Form data
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);

  // Available options matching your backend
  const years = [1, 2, 3, 4];
  const semesters = [1, 2];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (showCourses) {
      loadCourses();
    }
  }, [showCourses]);

  const fetchInitialData = async () => {
    try {
      const [deptResponse, facultyResponse, roomsResponse] = await Promise.all([
        getDepartments().catch(() => ({ data: [] })),
        getFaculty().catch(() => ({ data: [] })),
        getRooms().catch(() => ({ data: [] }))
      ]);
      
      setDepartments(deptResponse.data || []);
      setFacultyList(facultyResponse.data || []);
      setRoomsList(roomsResponse.data || []);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
      setError("Could not load initial data. Some features may not work properly.");
    }
  };

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        year: selectedYear,
        semester: selectedSemester,
        dept_name: selectedDepartment,
      };
      const response = await getCourses(params);
      setCourses(response.data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      setError(error.response?.data?.error || "Failed to load courses. Please try again.");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000); // Clear after 5 seconds
  };

  const showErrorMessage = (message) => {
    setError(message);
    setTimeout(() => setError(""), 8000); // Clear after 8 seconds
  };

  const handleSubmit = async (courseData) => {
    setError(null);
    
    try {
      const dataToSend = {
        ...courseData,
        year: selectedYear,
        semester: selectedSemester,
        dept_name: selectedDepartment,
        // Convert string values to appropriate types
        credits: parseInt(courseData.credits) || 0,
        hours_per_week: parseInt(courseData.hours_per_week) || 4,
        faculty_id: courseData.faculty_id ? parseInt(courseData.faculty_id) : null,
        fixed_room_id: courseData.fixed_room_id ? parseInt(courseData.fixed_room_id) : null,
      };

      let response;
      if (editingCourse) {
        response = await updateCourse(editingCourse.id, dataToSend);
        showSuccessMessage("Course updated successfully!");
      } else {
        response = await addCourse(dataToSend);
        showSuccessMessage("Course added successfully!");
      }

      setShowForm(false);
      setEditingCourse(null);
      loadCourses(); // Reload data after submission
      
    } catch (error) {
      console.error("Error saving course:", error);
      const errorMessage = error.response?.data?.error || 
                          (editingCourse ? "Failed to update course." : "Failed to add course.");
      showErrorMessage(errorMessage);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setShowForm(true);
    setError(null);
    setSuccessMessage("");
  };
  
  const handleProceed = () => {
    if (selectedYear && selectedSemester && selectedDepartment) {
      setShowCourses(true);
      setError(null);
      setSuccessMessage("");
    }
  };

  const handleReset = () => {
    setSelectedYear("");
    setSelectedSemester("");
    setSelectedDepartment("");
    setShowCourses(false);
    setCourses([]);
    setShowForm(false);
    setEditingCourse(null);
    setError(null);
    setSuccessMessage("");
  };

  const filteredCourses = courses.filter((course) =>
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Success/Error Toast Component
  const Toast = ({ message, type, onClose }) => {
    if (!message) return null;
    
    return (
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg transition-all duration-300 ${
        type === 'success' 
          ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-600" />
        )}
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // --- SELECTION SCREEN ---
  if (!showCourses) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Toast 
          message={successMessage} 
          type="success" 
          onClose={() => setSuccessMessage("")} 
        />
        <Toast 
          message={error} 
          type="error" 
          onClose={() => setError("")} 
        />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Course Management
            </h1>
            <p className="text-gray-600">Select year, semester, and department to manage courses</p>
          </div>
          
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-gray-800">Course Selection Criteria</CardTitle>
              <p className="text-gray-600">Please select all three criteria to proceed</p>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              {/* Year Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <label className="text-lg font-semibold text-gray-700">Academic Year</label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {years.map((year) => (
                    <Button
                      key={year}
                      variant={selectedYear === year ? "default" : "outline"}
                      onClick={() => setSelectedYear(year)}
                      className={`h-12 ${selectedYear === year ? "bg-blue-600 hover:bg-blue-700 shadow-lg" : "hover:bg-blue-50 hover:border-blue-300"}`}
                    >
                      Year {year}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Semester Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <label className="text-lg font-semibold text-gray-700">Semester</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {semesters.map((semester) => (
                    <Button
                      key={semester}
                      variant={selectedSemester === semester ? "default" : "outline"}
                      onClick={() => setSelectedSemester(semester)}
                      className={`h-12 ${selectedSemester === semester ? "bg-green-600 hover:bg-green-700 shadow-lg" : "hover:bg-green-50 hover:border-green-300"}`}
                    >
                      Semester {semester}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Department Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <label className="text-lg font-semibold text-gray-700">Department</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {departments.map((dept) => (
                    <Button
                      key={dept.id}
                      variant={selectedDepartment === dept.dept_name ? "default" : "outline"}
                      onClick={() => setSelectedDepartment(dept.dept_name)}
                      className={`h-12 ${selectedDepartment === dept.dept_name ? "bg-purple-600 hover:bg-purple-700 shadow-lg" : "hover:bg-purple-50 hover:border-purple-300"}`}
                    >
                      {dept.dept_name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Proceed Button */}
              <div className="pt-6 text-center">
                <Button
                  onClick={handleProceed}
                  disabled={!selectedYear || !selectedSemester || !selectedDepartment}
                  className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Proceed to Courses <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- MAIN COURSES SCREEN ---
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toast 
        message={successMessage} 
        type="success" 
        onClose={() => setSuccessMessage("")} 
      />
      <Toast 
        message={error} 
        type="error" 
        onClose={() => setError("")} 
      />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Selection Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Button onClick={handleReset} variant="outline" size="sm" className="text-xs mb-2">
              ← Change Selection
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Course Management
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Calendar className="w-3 h-3 mr-1" />
                Year {selectedYear}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <BookOpen className="w-3 h-3 mr-1" />
                Semester {selectedSemester}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Building2 className="w-3 h-3 mr-1" />
                {selectedDepartment}
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => { setShowForm(true); setEditingCourse(null); setError(null); }}
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Add New Course
          </Button>
        </div>

        {/* Search */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses by name, faculty, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Course Form */}
        {showForm && (
          <EnhancedCourseForm
            course={editingCourse}
            facultyList={facultyList}
            roomsList={roomsList}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCourse(null);
              setError(null);
            }}
          />
        )}

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-6 bg-gray-200 rounded w-3/4"></div></CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No courses found
              </h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search criteria" : "Add your first course for this selection"}
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <EnhancedCourseCard
                key={course.id}
                course={course}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Course Form Component matching backend fields
function EnhancedCourseForm({ course, facultyList, roomsList, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: course?.name || "",
    type: course?.type || "",
    credits: course?.credits || "",
    hours_per_week: course?.hours_per_week || 4,
    faculty_id: course?.faculty_id || "",
    is_fixed: course?.is_fixed || false,
    fixed_day: course?.fixed_day || "",
    fixed_slot: course?.fixed_slot || "",
    fixed_room_id: course?.fixed_room_id || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', 
    '13:00-14:00', '14:00-15:00', '15:00-16:00'
  ];

  return (
    <Card className="shadow-xl border-0 bg-white">
      <CardHeader>
        <CardTitle className="text-2xl">
          {course ? "Edit Course" : "Add New Course"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Course Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course Name *</label>
              <Input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g., Data Structures and Algorithms" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Course Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select type</option>
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
                <option value="Practical">Practical</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Credits *</label>
              <Input 
                name="credits" 
                type="number" 
                value={formData.credits} 
                onChange={handleChange} 
                placeholder="e.g., 3" 
                min="1"
                max="10"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hours per Week *</label>
              <Input 
                name="hours_per_week" 
                type="number" 
                value={formData.hours_per_week} 
                onChange={handleChange} 
                placeholder="e.g., 4" 
                min="1"
                max="20"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Assign Faculty</label>
              <select
                name="faculty_id"
                value={formData.faculty_id}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Faculty (Optional)</option>
                {facultyList.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.faculty_name} ({faculty.faculty_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fixed Slot Configuration */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="is_fixed"
                name="is_fixed"
                checked={formData.is_fixed}
                onChange={handleChange}
                className="rounded"
              />
              <label htmlFor="is_fixed" className="text-sm font-medium">
                Fixed Time Slot (Schedule at specific day/time)
              </label>
            </div>

            {formData.is_fixed && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fixed Day *</label>
                  <select
                    name="fixed_day"
                    value={formData.fixed_day}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required={formData.is_fixed}
                  >
                    <option value="">Select Day</option>
                    {daysOfWeek.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fixed Time Slot *</label>
                  <select
                    name="fixed_slot"
                    value={formData.fixed_slot}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required={formData.is_fixed}
                  >
                    <option value="">Select Time Slot</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fixed Room *</label>
                  <select
                    name="fixed_room_id"
                    value={formData.fixed_room_id}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required={formData.is_fixed}
                  >
                    <option value="">Select Room</option>
                    {roomsList.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.room_name} ({room.room_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {course ? "Updating..." : "Adding..."}
                </div>
              ) : (
                course ? "Update Course" : "Add Course"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Enhanced Course Card Component
function EnhancedCourseCard({ course, onEdit }) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-800">{course.name}</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {course.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {course.credits} Credits
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {course.hours_per_week}h/week
          </Badge>
          {course.is_fixed && (
            <Badge className="text-xs bg-orange-100 text-orange-800">
              Fixed Schedule
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Faculty Information */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{course.faculty_name || 'No Faculty Assigned'}</span>
        </div>

        {/* Fixed Schedule Information */}
        {course.is_fixed && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="text-xs font-medium text-orange-800 mb-1">Fixed Schedule:</div>
            <div className="space-y-1 text-xs text-orange-700">
              {course.fixed_day && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{course.fixed_day}</span>
                </div>
              )}
              {course.fixed_slot && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{course.fixed_slot}</span>
                </div>
              )}
              {course.fixed_room_id && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Room ID: {course.fixed_room_id}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={() => onEdit(course)} 
          variant="outline" 
          size="sm" 
          className="w-full hover:bg-blue-50 hover:border-blue-300"
        >
          Edit Course
        </Button>
      </CardContent>
    </Card>
  );
}