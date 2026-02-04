import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap } from "lucide-react";

const DEPT_COLORS = {
    "Computer Science": "from-blue-500 to-blue-600",
    "Electronics": "from-purple-500 to-purple-600",
    "Mechanical": "from-orange-500 to-orange-600",
    "Civil": "from-green-500 to-green-600",
    "Electrical": "from-yellow-500 to-yellow-600",
};

export default function SectionCard({ section, departments }) {
    const dept = departments?.find(d => d.id === section.dept_id);
    const deptName = dept?.dept_name || "Unknown";
    const colorClass = DEPT_COLORS[deptName] || "from-gray-500 to-gray-600";

    return (
        <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
                {/* Section Badge */}
                <div className={`w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}>
                    <span className="text-3xl font-bold text-white">{section.name}</span>
                </div>

                {/* Section Info */}
                <div className="space-y-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Section {section.name}</h3>
                        <p className="text-sm text-gray-600">{deptName}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                            <GraduationCap className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Year {section.year}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                            <Users className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{section.student_count || 0} students</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                            <BookOpen className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">{section.max_hours_per_day || 5} hrs/day</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
