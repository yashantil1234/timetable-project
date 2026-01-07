import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Save, 
  X, 
  User, 
  Mail, 
  Building2, 
  Clock, 
  Phone, 
  Award, 
  BookOpen,
  AlertCircle
} from "lucide-react";

// Predefined options that can be expanded
const DESIGNATIONS = [
  "Professor",
  "Associate Professor", 
  "Assistant Professor",
  "Lecturer",
  "Senior Lecturer",
  "Guest Faculty"
];

const QUALIFICATIONS = [
  "Ph.D",
  "M.Tech",
  "M.E",
  "M.Sc",
  "M.A",
  "M.Com",
  "MBA",
  "B.Tech",
  "B.E",
  "Other"
];

export default function TeacherForm({ teacher, departments, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    faculty_name: teacher?.faculty_name || "",
    email: teacher?.email || "",
    phone: teacher?.phone || "",
    dept_name: teacher?.dept_name || "",
    designation: teacher?.designation || "",
    qualification: teacher?.qualification || "",
    experience_years: teacher?.experience_years || 0,
    max_hours: teacher?.max_hours || 12, // Default from backend
    specialization: teacher?.specialization || "",
    joining_date: teacher?.joining_date || "",
    is_active: teacher?.is_active !== undefined ? teacher.is_active : true,
    address: teacher?.address || ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Required fields based on backend validation
    if (!formData.faculty_name?.trim()) {
      newErrors.faculty_name = "Faculty name is required";
    }
    if (!formData.dept_name) {
      newErrors.dept_name = "Department is required";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Max hours validation
    if (formData.max_hours < 1 || formData.max_hours > 40) {
      newErrors.max_hours = "Max hours must be between 1 and 40";
    }

    // Experience validation
    if (formData.experience_years < 0 || formData.experience_years > 50) {
      newErrors.experience_years = "Experience must be between 0 and 50 years";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const renderError = (field) => {
    if (errors[field]) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
          <AlertCircle className="w-3 h-3" />
          {errors[field]}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="w-6 h-6" />
            {teacher ? "Edit Teacher Profile" : "Add New Teacher"}
          </CardTitle>
          {teacher && (
            <Badge variant="secondary" className="bg-white/20 text-white">
              ID: {teacher.faculty_id}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="faculty_name" className="text-sm font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="faculty_name"
                  value={formData.faculty_name}
                  onChange={(e) => handleChange("faculty_name", e.target.value)}
                  placeholder="e.g., Dr. John Smith"
                  className={errors.faculty_name ? "border-red-500" : ""}
                />
                {renderError("faculty_name")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john.smith@college.edu"
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                  />
                </div>
                {renderError("email")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91 9876543210"
                    className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                  />
                </div>
                {renderError("phone")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Full address..."
                />
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Professional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dept_name" className="text-sm font-medium">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.dept_name}
                  onValueChange={(value) => handleChange("dept_name", value)}
                >
                  <SelectTrigger className={errors.dept_name ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id || dept.dept_name} value={dept.dept_name}>
                        {dept.dept_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderError("dept_name")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation" className="text-sm font-medium">Designation</Label>
                <Select
                  value={formData.designation}
                  onValueChange={(value) => handleChange("designation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  {/* <SelectContent>
                    {DESIGNATIONS.map((designation) => (
                      <SelectItem key={designation} value={designation}>
                        {designation}
                      </SelectItem>
                    ))} */}
                  {/* </SelectContent> */}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification" className="text-sm font-medium">Qualification</Label>
                <Select
                  value={formData.qualification}
                  onValueChange={(value) => handleChange("qualification", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  {/* <SelectContent>
                    {QUALIFICATIONS.map((qual) => (
                      <SelectItem key={qual} value={qual}>
                        {qual}
                      </SelectItem>
                    ))}
                  </SelectContent> */}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years" className="text-sm font-medium">Experience (Years)</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => handleChange("experience_years", parseInt(e.target.value) || 0)}
                  className={errors.experience_years ? "border-red-500" : ""}
                />
                {renderError("experience_years")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_hours" className="text-sm font-medium">
                  Max Hours/Week <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="max_hours"
                    type="number"
                    min="1"
                    max="40"
                    value={formData.max_hours}
                    onChange={(e) => handleChange("max_hours", parseInt(e.target.value) || 1)}
                    className={`pl-10 ${errors.max_hours ? "border-red-500" : ""}`}
                  />
                </div>
                {renderError("max_hours")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="joining_date" className="text-sm font-medium">Joining Date</Label>
                <Input
                  id="joining_date"
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => handleChange("joining_date", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Additional Information
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-sm font-medium">Specializations</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleChange("specialization", e.target.value)}
                  placeholder="e.g., Machine Learning, Data Structures, Algorithms (comma separated)"
                />
                <p className="text-xs text-gray-500">Separate multiple specializations with commas</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.is_active}
                      onChange={() => handleChange("is_active", true)}
                      className="text-green-600"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={!formData.is_active}
                      onChange={() => handleChange("is_active", false)}
                      className="text-red-600"
                    />
                    <span className="text-sm">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {teacher ? "Updating..." : "Adding..."}
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {teacher ? "Update Teacher" : "Add Teacher"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}