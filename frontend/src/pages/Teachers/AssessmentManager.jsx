import React, { useState, useEffect } from "react";
import ApiService from "../../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Trash2, CheckCircle, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AssessmentManager = () => {
    const [assessments, setAssessments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMarksModal, setShowMarksModal] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState({}); // { studentId: marks }
    const [csvFile, setCsvFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [newAssessment, setNewAssessment] = useState({
        title: "",
        course_id: "",
        assessment_type: "quiz",
        max_marks: "",
        scheduled_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assessmentsRes, myCoursesRes] = await Promise.all([
                ApiService.getAssessments(),
                ApiService.getTeacherCourses()
            ]);
            
            setAssessments(assessmentsRes?.assessments || []);
            // Defensive mapping for courses
            setCourses(myCoursesRes?.courses || (Array.isArray(myCoursesRes) ? myCoursesRes : []));
        } catch (err) {
            console.error("Failed to load assessment data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssessment = async () => {
        if (!newAssessment.title || !newAssessment.course_id || !newAssessment.max_marks) {
            alert("Please fill all required fields");
            return;
        }

        try {
            await ApiService.createAssessment(newAssessment);
            setShowCreateModal(false);
            loadData();
            // Reset form
            setNewAssessment({
                title: "",
                course_id: "",
                assessment_type: "quiz",
                max_marks: "",
                scheduled_date: new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            alert("Error creating assessment: " + err.message);
        }
    };

    const handleDeleteAssessment = async (id) => {
        if (!window.confirm("Are you sure you want to delete this assessment?")) return;
        try {
            await ApiService.deleteAssessment(id);
            loadData();
        } catch (err) {
            alert("Error deleting assessment: " + err.message);
        }
    };

    const openMarksEntry = async (assessment) => {
        setSelectedAssessment(assessment);
        setShowMarksModal(true);
        setMarksData({});
        setCsvFile(null);
        
        // Load students for this course
        try {
            const res = await ApiService.getTeacherStudents(assessment.course_id);
            setStudents(res?.students || []);
        } catch (err) {
            console.error("Failed to load students", err);
        }
    };

    const handleManualMarksSubmit = async () => {
        if (Object.keys(marksData).length === 0) return;
        
        setUploading(true);
        try {
            const formattedMarks = Object.entries(marksData).map(([id, marks]) => ({
                student_id: parseInt(id),
                marks: parseFloat(marks)
            }));
            
            await ApiService.uploadMarks(selectedAssessment.id, formattedMarks);
            alert("Marks uploaded successfully!");
            setShowMarksModal(false);
        } catch (err) {
            alert("Error uploading marks: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCsvUpload = async () => {
        if (!csvFile) return;
        
        setUploading(true);
        try {
            await ApiService.uploadMarks(selectedAssessment.id, csvFile, true);
            alert("CSV marks uploaded successfully!");
            setShowMarksModal(false);
        } catch (err) {
            alert("Error uploading CSV: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Assessment Management</h2>
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Test
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Assessment</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Title / Name</Label>
                                <Input 
                                    placeholder="e.g. Midterm Quiz" 
                                    value={newAssessment.title}
                                    onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Course</Label>
                                    <Select 
                                        onValueChange={(val) => setNewAssessment({...newAssessment, course_id: val})}
                                        value={newAssessment.course_id}
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
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select 
                                        onValueChange={(val) => setNewAssessment({...newAssessment, assessment_type: val})}
                                        value={newAssessment.assessment_type}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quiz">Quiz</SelectItem>
                                            <SelectItem value="assignment">Assignment</SelectItem>
                                            <SelectItem value="midterm">Midterm</SelectItem>
                                            <SelectItem value="final">Final Exam</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Total Marks</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="100" 
                                        value={newAssessment.max_marks}
                                        onChange={(e) => setNewAssessment({...newAssessment, max_marks: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input 
                                        type="date" 
                                        value={newAssessment.scheduled_date}
                                        onChange={(e) => setNewAssessment({...newAssessment, scheduled_date: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button onClick={handleCreateAssessment} className="bg-indigo-600">Save Assessment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Recent Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Max Marks</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assessments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                        No assessments created yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                assessments.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-semibold">{a.title}</TableCell>
                                        <TableCell>{a.course_name}</TableCell>
                                        <TableCell><Badge variant="outline">{a.assessment_type.toUpperCase()}</Badge></TableCell>
                                        <TableCell>{a.max_marks}</TableCell>
                                        <TableCell>{new Date(a.scheduled_date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                                onClick={() => openMarksEntry(a)}
                                            >
                                                Enter Marks
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteAssessment(a.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Marks Entry Modal */}
            <Dialog open={showMarksModal} onOpenChange={setShowMarksModal}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2 border-b border-gray-100">
                        <DialogTitle>Enter Marks: {selectedAssessment?.title}</DialogTitle>
                        <p className="text-sm text-gray-500">Course: {selectedAssessment?.course_name} | Max Marks: {selectedAssessment?.max_marks}</p>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div>
                                <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5" /> Bulk CSV Upload
                                </h4>
                                <p className="text-xs text-indigo-600 mt-1">Format: student_id, marks (no header required)</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input 
                                    type="file" 
                                    className="w-auto h-9 text-xs bg-white" 
                                    accept=".csv"
                                    onChange={(e) => setCsvFile(e.target.files[0])}
                                />
                                <Button 
                                    size="sm" 
                                    disabled={!csvFile || uploading} 
                                    onClick={handleCsvUpload}
                                    className="bg-indigo-600"
                                >
                                    {uploading ? "Uploading..." : "Upload CSV"}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900">Manual Table Entry</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="w-16">ID</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead className="w-32">Marks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell className="text-xs text-gray-500">{s.id}</TableCell>
                                                <TableCell className="font-medium text-sm">{s.full_name}</TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        className="h-8" 
                                                        max={selectedAssessment?.max_marks}
                                                        value={marksData[s.id] || ""}
                                                        onChange={(e) => setMarksData({...marksData, [s.id]: e.target.value})}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t border-gray-100 bg-gray-50">
                        <Button variant="outline" onClick={() => setShowMarksModal(false)}>Close</Button>
                        <Button 
                            disabled={uploading || Object.keys(marksData).length === 0} 
                            onClick={handleManualMarksSubmit}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {uploading ? "Saving..." : "Save Manual Entry"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AssessmentManager;
