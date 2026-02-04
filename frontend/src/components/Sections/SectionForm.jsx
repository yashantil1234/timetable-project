import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Save, X } from "lucide-react";

export default function SectionForm({ departments = [], onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        dept_name: "",
        year: 1,
        name: "",
        max_hours_per_day: 5
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.dept_name) {
            alert("Department is required");
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

    return (
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Add New Section
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Section Name (optional)</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="e.g., A, B, C (leave blank for auto)"
                                maxLength={1}
                            />
                            <p className="text-xs text-gray-500">Leave blank to auto-assign next available letter (A-Z)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_hours">Max Hours/Day</Label>
                            <Input
                                id="max_hours"
                                type="number"
                                value={formData.max_hours_per_day}
                                onChange={(e) => handleChange('max_hours_per_day', parseInt(e.target.value))}
                                min={1}
                                max={10}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            Add Section
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
