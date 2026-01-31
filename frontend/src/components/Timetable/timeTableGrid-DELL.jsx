
import React, { useState, useEffect, useCallback } from "react";
import { Course, Teacher, Room } from "../../services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
<import>ApiService from '/services/api';</import>

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetableGrid({ classes, timeSlots, isLoading, onClassClick }) {
  const [enrichedClasses, setEnrichedClasses] = useState([]);

  const enrichClasses = useCallback(async () => {
    const enriched = await Promise.all(
      classes.map(async (classItem) => {
        try {
          const [course, teacher, room] = await Promise.all([
            Course.list().then(courses => courses.find(c => c.id === classItem.course_id)),
            Teacher.list().then(teachers => teachers.find(t => t.id === classItem.teacher_id)),
            Room.list().then(rooms => rooms.find(r => r.id === classItem.room_id))
          ]);

          return { ...classItem, course, teacher, room };
        } catch (error) {
          // Log the error or handle it as appropriate, for now just return original item
          console.error("Error enriching class item:", error);
          return classItem;
        }
      })
    );
    setEnrichedClasses(enriched);
  }, [classes]); // Dependency array for useCallback

  useEffect(() => {
    if (Array.isArray(classes) && classes.length > 0) {
      enrichClasses();
    }
  }, [classes, enrichClasses]); // Dependency array for useEffect

  const getClassForSlot = (day, timeSlotId) => {
    return enrichedClasses.find(cls => 
      cls.day_of_week === day && cls.timeslot_id === timeSlotId
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-7 gap-4">
          {Array(42).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          <div className="p-4 text-center font-semibold text-gray-700 bg-white border-r">
            <Clock className="w-4 h-4 mx-auto mb-1" />
            Time
          </div>
          {DAYS.map(day => (
            <div key={day} className="p-4 text-center font-semibold text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Time slots and classes */}
        {timeSlots.map((timeSlot) => (
          <div key={timeSlot.id} className="grid grid-cols-7 border-b border-gray-200 min-h-[120px]">
            {/* Time slot column */}
            <div className="p-4 bg-white border-r flex flex-col justify-center items-center">
              <div className="text-sm font-semibold text-gray-900">
                {timeSlot.start_time}
              </div>
              <div className="text-xs text-gray-500">
                {timeSlot.end_time}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {timeSlot.duration_minutes}min
              </div>
            </div>

            {/* Day columns */}
            {DAYS.map(day => {
              const classItem = getClassForSlot(day, timeSlot.id);
              
              return (
                <div key={`${day}-${timeSlot.id}`} className="p-2 border-r last:border-r-0 bg-gray-50/30">
                  {classItem ? (
                    <div 
                      className="h-full bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-3 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => onClassClick(classItem)}
                    >
                      <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                        {classItem.course?.name || 'Unknown Course'}
                      </h4>
                      <p className="text-xs text-gray-600 mb-1">
                        {classItem.teacher?.name || 'TBA'}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {classItem.room?.name || 'TBA'}
                      </p>
                      {classItem.section && (
                        <Badge variant="outline" className="text-xs">
                          Sec {classItem.section}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <span className="text-xs">Free</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
