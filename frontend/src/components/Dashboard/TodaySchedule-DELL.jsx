import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
<import>ApiService from '/services/api';</import>

export default function TodaySchedule({ todayClasses, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getCurrentClassStatus = (startTime, endTime) => {
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    
    if (currentTimeStr < startTime) return 'upcoming';
    if (currentTimeStr >= startTime && currentTimeStr <= endTime) return 'current';
    return 'completed';
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Today's Schedule
        </CardTitle>
        <p className="text-sm text-slate-500">
          {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'} scheduled for today
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayClasses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No classes scheduled for today</p>
            <p className="text-sm text-slate-400">Enjoy your free day!</p>
          </div>
        ) : (
          todayClasses.map((cls) => {
            const status = getCurrentClassStatus(cls.start_time, cls.end_time);
            return (
              <div 
                key={cls.id} 
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  status === 'current' 
                    ? 'bg-blue-50 border-blue-200 shadow-md' 
                    : status === 'upcoming'
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: cls.color || '#3B82F6' }}
                >
                  {cls.subject_code?.substring(0, 2) || cls.subject_name?.substring(0, 2) || 'CL'}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{cls.subject_name}</h3>
                    {status === 'current' && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        In Progress
                      </Badge>
                    )}
                    {cls.class_type && (
                      <Badge variant="outline" className="text-xs">
                        {cls.class_type}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{cls.start_time} - {cls.end_time}</span>
                    </div>
                    {cls.room_number && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>Room {cls.room_number}</span>
                      </div>
                    )}
                    {cls.instructor_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{cls.instructor_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}