import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Edit, 
  Mail, 
  Clock, 
  Phone, 
  MapPin, 
  Award,
  BookOpen,
  Calendar,
  MoreVertical
} from "lucide-react";

const DEPARTMENT_COLORS = {
  "Computer Science": "bg-blue-100 text-blue-800 border-blue-200",
  "Information Technology": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Electronics": "bg-purple-100 text-purple-800 border-purple-200",
  "Mechanical": "bg-green-100 text-green-800 border-green-200",
  "Civil": "bg-orange-100 text-orange-800 border-orange-200",
  "Electrical": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Mathematics": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Physics": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Chemistry": "bg-red-100 text-red-800 border-red-200",
  "Biology": "bg-teal-100 text-teal-800 border-teal-200",
  "English": "bg-pink-100 text-pink-800 border-pink-200",
  "Business": "bg-violet-100 text-violet-800 border-violet-200",
  "default": "bg-gray-100 text-gray-800 border-gray-200"
};

const SPECIALIZATION_COLORS = {
  "Professor": "bg-gold-100 text-gold-800",
  "Associate Professor": "bg-blue-100 text-blue-800",
  "Assistant Professor": "bg-green-100 text-green-800",
  "Lecturer": "bg-purple-100 text-purple-800",
  "default": "bg-gray-100 text-gray-800"
};

export default function TeacherCard({ teacher, onEdit, onDelete, onViewDetails }) {
  // Safely access teacher properties with fallbacks
  const {
    id,
    faculty_name = "Unknown Faculty",
    faculty_id = "N/A",
    email = "Not provided",
    phone = "Not provided",
    dept_name = "Unknown Department",
    designation = "Faculty",
    specialization = [],
    max_hours = 20,
    experience_years = 0,
    qualification = "Not specified",
    courses_assigned = [],
    created_date,
    is_active = true,
    profile_image
  } = teacher || {};

  // Get department color with fallback
  const departmentColor = DEPARTMENT_COLORS[dept_name] || DEPARTMENT_COLORS.default;
  
  // Get designation color with fallback
  const designationColor = SPECIALIZATION_COLORS[designation] || SPECIALIZATION_COLORS.default;

  // Format creation date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "—";
    }
  };

  // Handle card actions
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(teacher);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(teacher);
  };

  const handleViewDetails = () => {
    onViewDetails?.(teacher);
  };

  return (
    <Card 
      className={`
        group relative overflow-hidden cursor-pointer
        hover:shadow-xl transition-all duration-300 
        bg-white/90 backdrop-blur-sm border-0 shadow-lg 
        hover:scale-[1.02] hover:-translate-y-1
        ${!is_active ? 'opacity-60' : ''}
      `}
      onClick={handleViewDetails}
    >
      {/* Status indicator */}
      <div className={`absolute top-0 left-0 w-full h-1 ${is_active ? 'bg-green-400' : 'bg-red-400'}`} />
      
      <CardHeader className="pb-3 relative">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Profile Image or Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {profile_image ? (
                <img 
                  src={profile_image} 
                  alt={faculty_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                faculty_name.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>

            {/* Name and ID */}
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {faculty_name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-blue-600">
                  {faculty_id}
                </p>
                {!is_active && (
                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-50"
              title="Edit Teacher"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Department and Designation */}
        <div className="flex flex-wrap gap-2">
          <Badge className={`${departmentColor} border text-xs font-medium`}>
            <MapPin className="w-3 h-3 mr-1" />
            {dept_name}
          </Badge>
          {designation && (
            <Badge className={`${designationColor} border text-xs font-medium`}>
              <Award className="w-3 h-3 mr-1" />
              {designation}
            </Badge>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate" title={email}>{email}</span>
          </div>
          
          {phone && phone !== "Not provided" && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{max_hours}h/week max</span>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{courses_assigned?.length || 0} Courses</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{experience_years}+ Years Exp</span>
          </div>
        </div>

        {/* Qualification */}
        {qualification && qualification !== "Not specified" && (
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            <strong>Qualification:</strong> {qualification}
          </div>
        )}

        {/* Specializations */}
        {specialization && specialization.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {specialization.slice(0, 3).map((spec, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                {spec}
              </Badge>
            ))}
            {specialization.length > 3 && (
              <Badge variant="outline" className="text-xs bg-gray-50">
                +{specialization.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Added {formatDate(created_date)}
            </span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Faculty</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Hover overlay for additional actions */}
      <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
}