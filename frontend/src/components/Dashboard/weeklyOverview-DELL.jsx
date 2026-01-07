import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, CalendarDays, TrendingUp } from "lucide-react";
<import>ApiService from '/services/api';</import>

const weekData = [
  { day: "Mon", classes: 8, utilization: 80 },
  { day: "Tue", classes: 10, utilization: 95 },
  { day: "Wed", classes: 7, utilization: 70 },
  { day: "Thu", classes: 9, utilization: 85 },
  { day: "Fri", classes: 6, utilization: 60 },
  { day: "Sat", classes: 3, utilization: 30 }
];

export default function WeeklyOverview() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <BarChart className="w-5 h-5 text-indigo-600" />
            Weekly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weekData.map((day) => (
              <div key={day.day} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{day.day}</span>
                  <span className="text-sm text-gray-500">{day.classes} classes</span>
                </div>
                <Progress 
                  value={day.utilization} 
                  className="h-2"
                />
                <div className="text-xs text-gray-500 text-right">
                  {day.utilization}% utilization
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">This Week</h3>
              <p className="text-sm text-gray-600">43 total classes scheduled</p>
              <p className="text-sm text-blue-600 font-medium">+12% from last week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}