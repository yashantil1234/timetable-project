import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Save, X } from "lucide-react";


export default function TeacherForm({ teacher, departments = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    faculty_name: teacher?.name || "",
    dept_name: teacher?.dept_name || "",
    email: teacher?.email || "",
    max_hours: teacher?.max_hours || 12,
    subject: teacher?.subject || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
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
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {teacher ? 'Edit Teacher' : 'Add New Teacher'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="faculty_name">Faculty Name *</Label>
              <Input
                id="faculty_name"
                value={formData.faculty_name}
                onChange={(e) => handleChange('faculty_name', e.target.value)}
                placeholder="e.g., Dr. John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john.smith@college.edu"
              />
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject/Specialization</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="e.g., Data Structures, Calculus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_hours">Max Hours/Week</Label>
              <Input
                id="max_hours"
                type="number"
                min="1"
                max="40"
                value={formData.max_hours}
                onChange={(e) => handleChange('max_hours', parseInt(e.target.value) || 12)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {teacher ? 'Update' : 'Create'} Teacher
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}