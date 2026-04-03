import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, Filter, Edit, Trash2, Mail, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import TeacherForm from "../../components/Teachers/TeacherForm";
import TeacherCard from "../../components/Teachers/TeacherCard";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[Teachers] Starting to load data...');
      setIsLoading(true);
      const [teachersData, departmentsData] = await Promise.all([
        api.getFaculty(),
        api.getDepartments()
      ]);

      const teacherList = Array.isArray(teachersData) ? teachersData : (teachersData?.faculty || teachersData?.data || []);
      const deptList = Array.isArray(departmentsData) ? departmentsData : (departmentsData?.departments || departmentsData?.data || []);

      setTeachers(teacherList);
      setDepartments(deptList);
      setIsLoading(false);
    } catch (error) {
      console.error('[Teachers] Error loading data:', error);
      console.error('[Teachers] Error details:', error.message, error.stack);
      setTeachers([]);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (teacherData) => {
    try {
      if (editingTeacher) {
        await api.updateFaculty(editingTeacher.id, teacherData);
        alert("Teacher updated successfully!");
      } else {
        await api.addFaculty(teacherData);
        alert("Teacher added successfully!");
      }
      setShowForm(false);
      setEditingTeacher(null);
      loadData();
    } catch (error) {
      console.error('Error submitting teacher:', error);
      alert(`Error: ${error.message || 'Failed to save teacher'}`);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
        await api.deleteFaculty(id);
        loadData();
    } catch (error) {
        alert("Failed to delete teacher");
    }
  };

  const getDepartmentColor = (dept) => {
    const colors = {
        "Computer Science": "bg-blue-100 text-blue-700 border-blue-200",
        "Mathematics": "bg-purple-100 text-purple-700 border-purple-200",
        "Physics": "bg-emerald-100 text-emerald-700 border-emerald-200",
        "Engineering": "bg-amber-100 text-amber-700 border-amber-200",
    };
    return colors[dept] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || teacher.dept_name === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  console.log('[Teachers] Filtering - Total teachers:', teachers.length, 'Filtered:', filteredTeachers.length, 'isLoading:', isLoading);


  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Teacher Management
            </h1>
            <p className="text-gray-600 mt-1">Manage faculty members and their information</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
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
                  placeholder="Search teachers by name or employee ID..."
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
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="all">All Departments</option>
                  {(Array.isArray(departments) ? departments : []).map(dept => (
                    <option key={dept.id} value={dept.dept_name}>{dept.dept_name}</option>
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
            }}
          />
        )}

        {/* Teachers List Table */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-md">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Teacher</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan="4" className="px-6 py-4">
                                        <div className="h-10 bg-gray-100 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : filteredTeachers.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-lg font-medium">No teachers found matching your criteria</p>
                                </td>
                            </tr>
                        ) : (
                            filteredTeachers.map((teacher) => (
                                <tr key={teacher.id} className="group hover:bg-blue-50/30 transition-colors duration-200">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-100 to-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                                                {teacher.name?.charAt(0) || 'T'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 leading-tight">{teacher.name}</p>
                                                <p className="text-xs text-gray-500 font-medium">Faculty ID: {teacher.id || teacher.faculty_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={`${getDepartmentColor(teacher.dept_name)} font-medium px-2.5 py-0.5 rounded-full`}>
                                            {teacher.dept_name || 'N/A'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="max-w-[200px] truncate">{teacher.email || 'No email provided'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleEdit(teacher)}
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleDelete(teacher.id || teacher.faculty_id)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100/50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
}