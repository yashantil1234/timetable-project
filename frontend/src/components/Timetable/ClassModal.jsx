
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import api from "../../services/api";
import timeSlotsData from "../../Data/timeslots.json";
import { Calendar, Clock, MapPin, User, BookOpen, Users } from "lucide-react";

export default function ClassModal({ classItem, onClose }) {
  const [details, setDetails] = useState({
    course: null,
    teacher: null,
    room: null,
    timeSlot: null
  });

  const loadClassDetails = useCallback(async () => {
    try {
      if (!classItem) {
        console.warn("classItem is undefined, cannot load details.");
        return;
      }

      const [courses, teachers, rooms] = await Promise.all([
        api.getCourses(),
        api.getFaculty(),
        api.getRooms()
      ]);

      const course = courses.find(c => c.id === classItem.course_id);
      const teacher = teachers.find(t => t.id === classItem.teacher_id);
      const room = rooms.find(r => r.id === classItem.room_id);
      const timeSlot = timeSlotsData.find(s => s.id === classItem.timeslot_id);

      setDetails({ course, teacher, room, timeSlot });
    } catch (error) {
      console.error("Error loading class details:", error);
    }
  }, [classItem]); // Depend on specific classItem properties

  useEffect(() => {
    loadClassDetails();
  }, [loadClassDetails]); // Depend on the memoized function

  const dayColors = {
    Monday: "bg-blue-100 text-blue-800",
    Tuesday: "bg-green-100 text-green-800", 
    Wednesday: "bg-purple-100 text-purple-800",
    Thursday: "bg-orange-100 text-orange-800",
    Friday: "bg-pink-100 text-pink-800",
    Saturday: "bg-indigo-100 text-indigo-800"
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-5 h-5 text-blue-600" />
            Class Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Course Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {details.course?.name || 'Course Name'}
                </h3>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{details.course?.code || 'N/A'}</span>
                  </div>
                  <Badge className={dayColors[classItem?.day_of_week] || "bg-gray-100 text-gray-800"}>
                    {classItem?.day_of_week}
                  </Badge>
                </div>
              </div>
              {classItem?.section && (
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Section {classItem.section}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Department:</span>
                <p className="font-medium">{details.course?.department || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Credits:</span>
                <p className="font-medium">{details.course?.credits || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Semester:</span>
                <p className="font-medium">{classItem?.semester}</p>
              </div>
              <div>
                <span className="text-gray-500">Academic Year:</span>
                <p className="font-medium">{classItem?.academic_year}</p>
              </div>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Time</h4>
              </div>
              <p className="text-gray-700">
                {details.timeSlot?.start_time || 'TBA'} - {details.timeSlot?.end_time || ''}
              </p>
              <p className="text-sm text-gray-500">
                {details.timeSlot?.duration_minutes || 0} minutes
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Teacher</h4>
              </div>
              <p className="text-gray-700">{details.teacher?.name || 'TBA'}</p>
              <p className="text-sm text-gray-500">{details.teacher?.department || ''}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Location</h4>
              </div>
              <p className="text-gray-700">{details.room?.name || 'TBA'}</p>
              <p className="text-sm text-gray-500">
                {details.room?.building || ''} {details.room?.floor ? `(${details.room.floor})` : ''}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {(details.room?.capacity || details.room?.room_type || classItem?.max_students) && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Additional Information
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {details.room?.room_type && (
                  <div>
                    <span className="text-gray-500">Room Type:</span>
                    <p className="font-medium">{details.room.room_type}</p>
                  </div>
                )}
                {details.room?.capacity && (
                  <div>
                    <span className="text-gray-500">Room Capacity:</span>
                    <p className="font-medium">{details.room.capacity} students</p>
                  </div>
                )}
                {classItem?.max_students && (
                  <div>
                    <span className="text-gray-500">Class Limit:</span>
                    <p className="font-medium">{classItem.max_students} students</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
