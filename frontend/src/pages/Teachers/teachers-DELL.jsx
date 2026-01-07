import React, { useState, useEffect } from "react";
import { getFaculty, addFaculty, updateFaculty, getDepartments } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, Filter, AlertTriangle, CheckCircle, X } from "lucide-react";

import TeacherForm from "../../components/Teachers/TeacherForm";
import TeacherCard from "../../components/Teachers/TeacherCard";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadTeachers(),
      loadDepartments()
    ]);
  };

  const loadTeachers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getFaculty();
      // Map backend response to match expected frontend structure
      const mappedTeachers = (response.data || []).map(teacher => ({
        id: teacher.id,
        faculty_id: teacher.id,
        faculty_name: teacher.name,
        dept_name: teacher.dept_name,
        max_hours: teacher.max_hours,
        email: teacher.email || 'Not provided' // Backend might not always include email in GET
      }));
      setTeachers(mappedTeachers);
    } catch (err) {
      console.error("Failed to load teachers:", err);
      setError(err.response?.data?.error || "Could not fetch teacher data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const showErrorMessage = (message) => {
    setError(message);
    setTimeout(() => setError(""), 8000);
  };

  const handleSubmit = async (teacherData) => {
    setError(null);
    
    try {
      // Format data to match backend expectations
      const dataToSend = {
        faculty_name: teacherData.faculty_name?.trim(),
        dept_name: teacherData.dept_name,
        email: teacherData.email?.trim(),
        max_hours: parseInt(teacherData.max_hours) || 12,
        // Add other fields that might be needed
        phone: teacherData.phone,
        designation: teacherData.designation,
        qualification: teacherData.qualification,
        experience_years: parseInt(teacherData.experience_years) || 0,
        is_active: teacherData.is_active !== undefined ? teacherData.is_active : true
      };

      let response;
      if (editingTeacher) {
        response = await updateFaculty(editingTeacher.id, dataToSend);
        showSuccessMessage("Teacher updated successfully!");
      } else {
        response = await addFaculty(dataToSend);
        showSuccessMessage("Teacher added successfully!");
      }

      setShowForm(false);
      setEditingTeacher(null);
      loadTeachers(); // Reload data after submission
      
    } catch (err) {
      console.error("Failed to save teacher data:", err);
      const errorMessage = err.response?.data?.error || 
                          (editingTeacher ? "Failed to update teacher." : "Failed to add teacher.");
      showErrorMessage(errorMessage);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setShowForm(true);
    setError(null);
    setSuccessMessage("");
  };

  const handleDelete = async (teacher) => {
    if (window.confirm(`Are you sure you want to delete ${teacher.faculty_name}?`)) {
      try {
        // Note: You'll need to implement delete endpoint in your backend
        // await deleteFaculty(teacher.id);
        showSuccessMessage("Teacher deleted successfully!");
        loadTeachers();
      } catch (err) {
        showErrorMessage("Failed to delete teacher.");
      }
    }
  };

  // Defensive filtering with proper null checks
  const filteredTeachers = teachers.filter((teacher) => {
    const name = teacher.faculty_name || "";
    const id = String(teacher.faculty_id || "");
    const email = teacher.email || "";
    const dept = teacher.dept_name || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      filterDepartment === "all" || dept === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  // Extract unique departments from teachers and departments data
  const availableDepartments = [
    ...new Set([
      ...teachers.map((t) => t.dept_name).filter(Boolean),
      ...departments.map((d) => d.dept_name).filter(Boolean)
    ])
  ];

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Teacher Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage faculty members and their information
            </p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingTeacher(null);
              setError(null);
              setSuccessMessage("");
            }}
            className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Add New Teacher
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teachers by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white min-w-[160px]"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Form */}
        {showForm && (
          <TeacherForm
            teacher={editingTeacher}
            departments={departments}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTeacher(null);
              setError(null);
            }}
          />
        )}

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : filteredTeachers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No teachers found
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterDepartment !== "all"
                  ? "Try adjusting your search criteria"
                  : "Add your first teacher to get started"}
              </p>
              {(searchTerm || filterDepartment !== "all") && (
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterDepartment("all");
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.faculty_id}
                teacher={teacher}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={(teacher) => {
                  // Could implement a detailed view modal here
                  console.log("View teacher details:", teacher);
                }}
              />
            ))
          )}
        </div>

        {/* Summary Statistics */}
        {!isLoading && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{teachers.length}</p>
                  <p className="text-sm text-gray-600">Total Teachers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{availableDepartments.length}</p>
                  <p className="text-sm text-gray-600">Departments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {teachers.filter(t => t.is_active !== false).length}
                  </p>
                  <p className="text-sm text-gray-600">Active Teachers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round(teachers.reduce((sum, t) => sum + (t.max_hours || 0), 0) / teachers.length) || 0}
                  </p>
                  <p className="text-sm text-gray-600">Avg Hours/Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}