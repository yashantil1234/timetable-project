import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, Filter, Edit, Trash2, GraduationCap, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import StudentForm from "../../components/Students/StudentForm";
import StudentCard from "../../components/Students/StudentCard";

export default function Students() {
    const [students, setStudents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("all");
    const [filterYear, setFilterYear] = useState("all");
    const [filterSection, setFilterSection] = useState("all");
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [studentsData, departmentsData, sectionsData] = await Promise.all([
                api.getStudents(),
                api.getDepartments(),
                api.getSections()
            ]);

            const studentList = Array.isArray(studentsData) ? studentsData : (studentsData?.students || studentsData?.data || []);
            const deptList = Array.isArray(departmentsData) ? departmentsData : (departmentsData?.departments || departmentsData?.data || []);
            const sectionList = Array.isArray(sectionsData) ? sectionsData : (sectionsData?.sections || sectionsData?.data || []);

            setStudents(studentList);
            setDepartments(deptList);
            setSections(sectionList);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setStudents([]);
            setDepartments([]);
            setSections([]);
            setIsLoading(false);
        }
    };

    const handleSubmit = async (studentData) => {
        try {
            if (editingStudent) {
                await api.updateUser(editingStudent.id, studentData);
                alert("Student updated successfully!");
            } else {
                await api.addStudent(studentData);
                alert("Student added successfully!");
            }
            setShowForm(false);
            setEditingStudent(null);
            loadData();
        } catch (error) {
            console.error('Error submitting student:', error);
            alert(`Error: ${error.message || 'Failed to save student'}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;
        try {
            await api.deleteUser(id); // Students are users
            loadData();
        } catch (error) {
            alert("Failed to delete student");
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setShowForm(true);
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

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = filterDepartment === "all" || student.dept_name === filterDepartment;
        const matchesYear = filterYear === "all" || student.year === parseInt(filterYear);
        const matchesSection = filterSection === "all" || student.section_name === filterSection;
        return matchesSearch && matchesDepartment && matchesYear && matchesSection;
    });

    return (
        <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Student Management
                        </h1>
                        <p className="text-gray-600 mt-1">Manage students and their information</p>
                    </div>
                    <Button
                        onClick={() => setShowForm(true)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg hover:scale-105 transition-all duration-300"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Student
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search students by name or username..."
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
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                                >
                                    <option value="all">All Years</option>
                                    <option value="1">Year 1</option>
                                    <option value="2">Year 2</option>
                                    <option value="3">Year 3</option>
                                    <option value="4">Year 4</option>
                                </select>
                                <select
                                    value={filterSection}
                                    onChange={(e) => setFilterSection(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                                >
                                    <option value="all">All Sections</option>
                                    {[...new Set((Array.isArray(sections) ? sections : []).map(s => s.name))].sort().map(sectionName => (
                                        <option key={sectionName} value={sectionName}>{sectionName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Student Form */}
                {showForm && (
                    <StudentForm
                        student={editingStudent}
                        departments={departments}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingStudent(null);
                        }}
                    />
                )}

                {/* Students List Table */}
                <Card className="shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Year/Section</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-6 py-4">
                                                <div className="h-10 bg-gray-100 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-lg font-medium">No students found matching your criteria</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="group hover:bg-blue-50/30 transition-colors duration-200">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                        {student.full_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 leading-tight">{student.full_name}</p>
                                                        <p className="text-xs text-blue-600 font-medium">@{student.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`${getDepartmentColor(student.dept_name)} font-medium px-2.5 py-0.5 rounded-full`}>
                                                    {student.dept_name || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                                                    <span className="font-medium">
                                                        Year {student.year || '?'}{student.section_name && ` - Sec ${student.section_name}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="max-w-[150px] truncate">{student.email || 'No email'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => handleEdit(student)}
                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => handleDelete(student.id)}
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
