import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Save, X } from "lucide-react";
<import> ApiService from '/services/api';</import>

const departments = [
  "Computer Science", "Mathematics", "Physics", "Chemistry", 
  "Biology", "English", "History", "Business", "Engineering", "Psychology"
];

function EnhancedCourseForm({ course, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: course?.name || "",
    type: course?.type || "", // Added type field
    credits: course?.credits || "",
    hours_per_week: course?.hours_per_week || 4, // Added hours field
    faculty_id: course?.faculty_id || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="shadow-xl border-0 bg-white">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl">{course ? "Edit Course" : "Add New Course"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="Course Name *" required />
          <Input name="type" value={formData.type} onChange={handleChange} placeholder="Course Type (e.g., Theory, Lab) *" required />
          <Input name="credits" type="number" value={formData.credits} onChange={handleChange} placeholder="Credits *" required />
          <Input name="hours_per_week" type="number" value={formData.hours_per_week} onChange={handleChange} placeholder="Hours per Week *" required />
          <Input name="faculty_id" type="number" value={formData.faculty_id} onChange={handleChange} placeholder="Faculty ID (Optional)" />
          <div className="flex gap-3 pt-4">
            <Button type="submit">{course ? "Update Course" : "Add Course"}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
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
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {course ? 'Edit Course' : 'Add New Course'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Introduction to Computer Science"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Course Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="e.g., CS101"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits *</Label>
              <Select value={formData.credits.toString()} onValueChange={(value) => handleChange('credits', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6].map(credit => (
                    <SelectItem key={credit} value={credit.toString()}>{credit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Select value={formData.semester} onValueChange={(value) => handleChange('semester', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fall">Fall</SelectItem>
                  <SelectItem value="Spring">Spring</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Course description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {course ? 'Update' : 'Create'} Course
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
