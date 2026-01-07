import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Edit, Users, Clock } from "lucide-react";

const departmentColors = {
  "Computer Science": "bg-blue-100 text-blue-800",
  "Mathematics": "bg-purple-100 text-purple-800",
  "Physics": "bg-green-100 text-green-800",
  "Chemistry": "bg-orange-100 text-orange-800",
  "Biology": "bg-emerald-100 text-emerald-800",
  "English": "bg-pink-100 text-pink-800",
  "History": "bg-amber-100 text-amber-800",
  "Business": "bg-indigo-100 text-indigo-800",
  "Engineering": "bg-red-100 text-red-800",
  "Psychology": "bg-cyan-100 text-cyan-800"
};

export default function CourseCard({ course, onEdit }) {
  const departmentColor = departmentColors[course.department] || "bg-gray-100 text-gray-800";

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {course.name}
            </CardTitle>
            <p className="text-sm font-medium text-blue-600">{course.code}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(course)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={`${departmentColor} border-0`}>
              {course.department}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {course.semester}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.credits} credits</span>
            </div>
          </div>

          {course.description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Created {new Date(course.created_date).toLocaleDateString()}</span>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>Course</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}