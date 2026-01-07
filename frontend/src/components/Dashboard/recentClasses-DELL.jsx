import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// 1. Correctly import all necessary API objects from your service file
import { Course, Teacher, Room, TimeSlot } from "../../services/api"; 
import { Calendar, Clock, MapPin, User } from "lucide-react";

const dayColors = {
  Monday: "bg-blue-100 text-blue-800",
  Tuesday: "bg-green-100 text-green-800", 
  Wednesday: "bg-purple-100 text-purple-800",
  Thursday: "bg-orange-100 text-orange-800",
  Friday: "bg-pink-100 text-pink-800",
  Saturday: "bg-indigo-100 text-indigo-800"
};

export default function RecentClasses({ classes, isLoading }) {
  const [enrichedClasses, setEnrichedClasses] = useState([]);
  
  // 2. This function is now much more efficient
  const enrichClasses = useCallback(async () => {
    if (!classes || classes.length === 0) {
      setEnrichedClasses([]);
      return;
    }
    
    try {
      // Fetch all data lists only ONCE
      const [courses, teachers, rooms, timeSlots] = await Promise.all([
        Course.list(),
        Teacher.list(),
        Room.list(),
        TimeSlot.list()
      ]);

      // Create maps for quick lookups (much faster than .find() in a loop)
      const courseMap = new Map(courses.map(c => [c.id, c]));
      const teacherMap = new Map(teachers.map(t => [t.id, t]));
      const roomMap = new Map(rooms.map(r => [r.id, r]));
      const timeSlotMap = new Map(timeSlots.map(s => [s.id, s]));

      // Enrich the class data by looking up details in the maps
      const enriched = classes.map(classItem => ({
        ...classItem,
        course: courseMap.get(classItem.course_id),
        teacher: teacherMap.get(classItem.teacher_id),
        room: roomMap.get(classItem.room_id),
        timeSlot: timeSlotMap.get(classItem.timeslot_id)
      }));

      setEnrichedClasses(enriched);
    } catch (error) {
      console.error("Error enriching classes:", error);
      // Fallback to original data if enrichment fails
      setEnrichedClasses(classes); 
    }
  }, [classes]);

  useEffect(() => {
    enrichClasses();
  }, [enrichClasses]);

  // --- NO CHANGES TO JSX OR STYLING BELOW THIS LINE ---

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Calendar className="w-5 h-5 text-blue-600" />
          Recent Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : enrichedClasses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No classes scheduled yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrichedClasses.map((classItem) => (
              <div 
                key={classItem.id}
                className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300 bg-white/50"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {classItem.course?.name || 'Unknown Course'}
                  </h3>
                  <Badge className={dayColors[classItem.day_of_week] || "bg-gray-100 text-gray-800"}>
                    {classItem.day_of_week}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span>{classItem.teacher?.name || 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span>{classItem.room?.name || 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span>
                      {classItem.timeSlot?.start_time || 'TBA'} - {classItem.timeSlot?.end_time || ''}
                    </span>
                  </div>
                </div>

                {classItem.section && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Section {classItem.section}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}