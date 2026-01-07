import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DayView({ classes, selectedDay, setSelectedDay, days, isLoading }) {
  const dayClasses = classes
    .filter(cls => cls.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex gap-2 flex-wrap">
              {days.map(day => (
                <Skeleton key={day} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          </CardHeader>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="space-y-4 p-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Selection */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 mb-4">Select Day</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {days.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                onClick={() => setSelectedDay(day)}
                className={selectedDay === day ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {day}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Day Schedule */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {selectedDay} Schedule
          </CardTitle>
          <p className="text-sm text-slate-500">
            {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'} scheduled
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {dayClasses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No classes scheduled for {selectedDay}</p>
              <p className="text-sm text-slate-400">This day is free!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className="flex items-center gap-4 p-6 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: cls.color || '#3B82F6' }}
                  >
                    {cls.subject_code || cls.subject_name?.substring(0, 3) || 'CLS'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{cls.subject_name}</h3>
                        {cls.subject_code && (
                          <p className="text-slate-600">{cls.subject_code}</p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className="capitalize bg-slate-50 text-slate-700"
                      >
                        {cls.class_type || 'lecture'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{cls.start_time} - {cls.end_time}</span>
                      </div>
                      {cls.room_number && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span>Room {cls.room_number}</span>
                        </div>
                      )}
                      {cls.instructor_name && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-500" />
                          <span>{cls.instructor_name}</span>
                        </div>
                      )}
                    </div>
                    
                    {cls.department && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {cls.department}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}