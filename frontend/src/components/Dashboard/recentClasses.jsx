
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import  Course  from "../../api";
import  Teacher  from "../../api";
import  Subject  from "../../api";
import  Room  from "../../api";
import  TimeSlot  from "../../api";
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

  const enrichClasses = useCallback(async () => {
    const enriched = await Promise.all(
      classes.map(async (classItem) => {
        try {
          const [course, teacher, room, timeSlot] = await Promise.all([
            Course.list().then(courses => courses.find(c => c.id === classItem.course_id)),
            Teacher.list().then(teachers => teachers.find(t => t.id === classItem.teacher_id)),
            Room.list().then(rooms => rooms.find(r => r.id === classItem.room_id)),
            TimeSlot.list().then(slots => slots.find(s => s.id === classItem.timeslot_id))
          ]);

          return {
            ...classItem,
            course,
            teacher,
            room,
            timeSlot
          };
        } catch (error) {
          console.error("Error enriching class item:", error);
          return classItem; // Return original item on error
        }
      })
    );
    setEnrichedClasses(enriched);
  }, [classes]); // 'classes' is a dependency because 'enrichClasses' uses it

  useEffect(() => {
    if (classes.length > 0) {
      enrichClasses();
    }
  }, [classes, enrichClasses]); // 'enrichClasses' is a dependency as it's a memoized callback

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
