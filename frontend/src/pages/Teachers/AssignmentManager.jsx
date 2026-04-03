import React, { useState, useEffect } from "react";
import ApiService from "../../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Upload, Trash2, CheckCircle, AlertCircle, Loader2, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AssignmentManager = () => {
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [newAssignment, setNewAssignment] = useState({
        title: "",
        description: "",
        due_date: "",
        target_audience: "course",
        course_id: "",
        dept_id: "",
        section_id: "",
        file: null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assignmentsRes, myCoursesRes, deptsRes, sectionsRes] = await Promise.all([
                ApiService.getFacultyAssignments(),
                ApiService.getTeacherCourses(),
                ApiService.getDepartmentsPublic(),
                ApiService.getSectionsPublic()
            ]);
            
            // Fixed mapping: Legacy endpoints return arrays directly
            setAssignments(assignmentsRes?.assignments || []);
            setCourses(myCoursesRes?.courses || []);
            setDepartments(Array.isArray(deptsRes) ? deptsRes : (deptsRes?.departments || []));
            setSections(Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.sections || []));
        } catch (err) {
            console.error("Failed to load assignment data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        
        if (!newAssignment.title || !newAssignment.target_audience) {
            alert("Please fill all required fields");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', newAssignment.title);
            formData.append('description', newAssignment.description);
            formData.append('due_date', newAssignment.due_date);
            formData.append('target_audience', newAssignment.target_audience);
            
            if (newAssignment.course_id) formData.append('course_id', newAssignment.course_id);
            if (newAssignment.dept_id) formData.append('dept_id', newAssignment.dept_id);
            if (newAssignment.section_id) formData.append('section_id', newAssignment.section_id);
            if (newAssignment.file) formData.append('file', newAssignment.file);

            await ApiService.createAssignment(formData);
            setShowCreateModal(false);
            loadData();
            // Reset form
            setNewAssignment({
                title: "",
                description: "",
                due_date: "",
                target_audience: "course",
                course_id: "",
                dept_id: "",
                section_id: "",
                file: null
            });
        } catch (err) {
            alert("Error creating assignment: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Assignment Management</h2>
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Assignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Assignment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateAssignment} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Title <span className="text-red-500">*</span></Label>
                                <Input 
                                    placeholder="e.g. Lab Exercise 1" 
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Input 
                                    placeholder="Quick details..." 
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Due Date</Label>
                                    <Input 
                                        type="date" 
                                        value={newAssignment.due_date}
                                        onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>File Upload</Label>
                                    <Input 
                                        type="file" 
                                        className="h-9 p-0"
                                        onChange={(e) => setNewAssignment({...newAssignment, file: e.target.files[0]})}
                                    />
                                </div>
                            </div>
                            
                            <hr className="my-2" />
                            
                            <div className="grid gap-2">
                                <Label>Target Audience <span className="text-red-500">*</span></Label>
                                <Select 
                                    onValueChange={(val) => setNewAssignment({...newAssignment, target_audience: val, course_id: "", dept_id: "", section_id: ""})}
                                    value={newAssignment.target_audience}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="course">Specific Course</SelectItem>
                                        <SelectItem value="department">Whole Department</SelectItem>
                                        <SelectItem value="section">Specific Section</SelectItem>
                                        <SelectItem value="all">Everyone</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {newAssignment.target_audience === 'course' && (
                                <div className="grid gap-2">
                                    <Label>Course</Label>
                                    <Select 
                                        onValueChange={(val) => setNewAssignment({...newAssignment, course_id: val})}
                                        value={newAssignment.course_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {newAssignment.target_audience === 'department' && (
                                <div className="grid gap-2">
                                    <Label>Department</Label>
                                    <Select 
                                        onValueChange={(val) => setNewAssignment({...newAssignment, dept_id: val})}
                                        value={newAssignment.dept_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(d => (
                                                <SelectItem key={d.id} value={d.id.toString()}>{d.dept_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {newAssignment.target_audience === 'section' && (
                                <div className="grid gap-2">
                                    <Label>Section</Label>
                                    <Select 
                                        onValueChange={(val) => setNewAssignment({...newAssignment, section_id: val})}
                                        value={newAssignment.section_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name} (Year {s.year})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={uploading} className="bg-blue-600">
                                    {uploading ? "Creating..." : "Publish Assignment"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Published Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assignments.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                No assignments created yet.
                            </div>
                        ) : (
                            assignments.map((a) => (
                                <div key={a.id} className="p-4 border rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center">
                                    <div className="flex gap-4 items-start">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{a.title}</h4>
                                            <p className="text-sm text-gray-500">{a.description}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                                    {a.target_audience.toUpperCase()}: {a.course_name || a.dept_name || a.section_name || 'ALL'}
                                                </Badge>
                                                {a.due_date && (
                                                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                                        Due: {new Date(a.due_date).toLocaleDateString()}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {a.file_url && (
                                            <a 
                                                href={`${ApiService.getBaseURL()}${a.file_url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                                title="View Attachment"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                            // onClick={() => handleDeleteAssignment(a.id)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AssignmentManager;
