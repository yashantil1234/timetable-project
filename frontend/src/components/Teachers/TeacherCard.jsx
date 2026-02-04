import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Edit, Mail, Phone, Clock } from "lucide-react";

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

export default function TeacherCard({ teacher, onEdit }) {
  const departmentColor = departmentColors[teacher.dept_name] || "bg-gray-100 text-gray-800";

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
              {teacher.name}
            </CardTitle>
            <p className="text-sm font-medium text-green-600">ID: {teacher.id}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(teacher)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Badge className={`${departmentColor} border-0`}>
            {teacher.dept_name}
          </Badge>

          <div className="space-y-2 text-sm">
            {teacher.subject && (
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="font-medium">{teacher.subject}</span>
              </div>
            )}
            {teacher.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{teacher.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{teacher.max_hours || 12}h/week max</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Faculty Member</span>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Faculty</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
