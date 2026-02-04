import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save, X } from "lucide-react";
import api from "../../services/api";

export default function StudentForm({ student, departments = [], onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        username: student?.username || "",
        full_name: student?.full_name || "",
        email: student?.email || "",
        dept_name: student?.dept_name || "",
        year: student?.year || 1,
        section_name: student?.section_name || "",
        password: ""
    });

    const [sections, setSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);

    // Load sections when department or year changes
    useEffect(() => {
        if (formData.dept_name && formData.year) {
            loadSections();
        } else {
            setSections([]);
        }
    }, [formData.dept_name, formData.year]);

    const loadSections = async () => {
        try {
            setLoadingSections(true);
            const allSections = await api.getSections();
            const dept = departments.find(d => d.dept_name === formData.dept_name);
            if (dept) {
                const filtered = allSections.filter(s =>
                    s.dept_id === dept.id && s.year === formData.year
                );
                setSections(filtered);
            }
        } catch (error) {
            console.error('Error loading sections:', error);
            setSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!student && !formData.password) {
            alert("Password is required for new students");
            return;
        }
        if (!formData.section_name) {
            alert("Section is required. Please select a section.");
            return;
        }
        onSubmit(formData);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getSectionPlaceholder = () => {
        if (loadingSections) return "Loading sections...";
        if (!formData.dept_name || !formData.year) return "Select department and year first";
        if (sections.length === 0) return "No sections available - contact admin";
        return "Select section";
    };

    return (
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {student ? 'Edit Student' : 'Add New Student'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => handleChange('full_name', e.target.value)}
                                placeholder="e.g., John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username *</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                                placeholder="e.g., john.doe"
                                required
                                disabled={!!student}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="john.doe@college.edu"
                            />
                        </div>
                        {!student && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dept_name">Department *</Label>
                            <Select value={formData.dept_name} onValueChange={(value) => handleChange('dept_name', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.dept_name}>{dept.dept_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year">Year *</Label>
                            <Select value={formData.year.toString()} onValueChange={(value) => handleChange('year', parseInt(value))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Year 1</SelectItem>
                                    <SelectItem value="2">Year 2</SelectItem>
                                    <SelectItem value="3">Year 3</SelectItem>
                                    <SelectItem value="4">Year 4</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section_name">Section *</Label>
                        <Select
                            value={formData.section_name}
                            onValueChange={(value) => handleChange('section_name', value)}
                            disabled={loadingSections}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={getSectionPlaceholder()} />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(section => (
                                    <SelectItem key={section.id} value={section.name}>Section {section.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!loadingSections && sections.length === 0 && formData.dept_name && formData.year && (
                            <p className="text-xs text-red-500">⚠️ No sections available for this department and year. Please create sections first before adding students.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            {student ? 'Update' : 'Add'} Student
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
