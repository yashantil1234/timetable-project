import React, { useState, useEffect, useCallback } from "react";
import { TimeSlot, Teacher, Subject, Room } from "../../api";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassModal from "../../components/Timetable/ClassModal";
import ScheduleForm from "../../components/Timetable/ScheduleForm";
import TimetableGrid from "../../components/timetable/TimetableGrid";
import ConflictChecker from "../../components/Timetable/ConflictChecker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import DayView from "../../components/Timetable/DayView";


export default function Timetable() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [conflicts, setConflicts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    loadTimetableData();
  }, []);

  const checkConflicts = useCallback(() => {
    const conflictList = [];
    
    timeSlots.forEach((slot, index) => {
      timeSlots.slice(index + 1).forEach(otherSlot => {
        if (slot.day === otherSlot.day &&
            slot.start_time === otherSlot.start_time &&
            slot.end_time === otherSlot.end_time) {
          
          if (slot.teacher_id === otherSlot.teacher_id) {
            conflictList.push({
              type: 'teacher',
              message: `Teacher conflict on ${slot.day} ${slot.start_time}-${slot.end_time}`,
              slots: [slot, otherSlot]
            });
          }
          
          if (slot.room_id === otherSlot.room_id) {
            conflictList.push({
              type: 'room',
              message: `Room conflict on ${slot.day} ${slot.start_time}-${slot.end_time}`,
              slots: [slot, otherSlot]
            });
          }
        }
      });
    });
    
    setConflicts(conflictList);
  }, [timeSlots]);

  useEffect(() => {
    checkConflicts();
  }, [checkConflicts]);

  const loadTimetableData = async () => {
    setIsLoading(true);
    try {
      const [slotsData, teachersData, subjectsData, roomsData] = await Promise.all([
        TimeSlot.list(),
        Teacher.list(),
        Subject.list(),
        Room.list()
      ]);

      setTimeSlots(slotsData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading timetable data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (slotData) => {
    if (editingSlot) {
      await TimeSlot.update(editingSlot.id, slotData);
    } else {
      await TimeSlot.create(slotData);
    }
    setShowForm(false);
    setEditingSlot(null);
    loadTimetableData();
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setShowForm(true);
  };

  const filteredSlots = timeSlots.filter(slot => slot.semester === selectedSemester);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              Timetable
            </h1>
            <p className="text-lg text-gray-600">Schedule and manage class timetables</p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-[150px] bg-white border border-gray-300">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
                <SelectItem value="3">Semester 3</SelectItem>
                <SelectItem value="4">Semester 4</SelectItem>
                <SelectItem value="5">Semester 5</SelectItem>
                <SelectItem value="6">Semester 6</SelectItem>
                <SelectItem value="7">Semester 7</SelectItem>
                <SelectItem value="8">Semester 8</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Schedule
            </Button>
          </div>
        </div>

        <Tabs defaultValue="grid" className="mb-6 ">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-blue-200 w-full max-w-md grid-cols-2 mx-auto rounded-full p-1 shadow-sm flex justify-around">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
            <TabsTrigger value="daily">
              <Clock className="w-4 h-4" />
              Daily View
              </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-6">
            <TimetableGrid
              timeSlots={filteredSlots}
              teachers={teachers}
              subjects={subjects}
              rooms={rooms}
              onEdit={handleEdit}
              isLoading={isLoading}
            />

            {showForm && (
              <ScheduleForm
                slot={editingSlot}
                teachers={teachers}
                subjects={subjects}
                rooms={rooms}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingSlot(null);
                }}
              />
            )}

            
          </TabsContent>

          <TabsContent value="conflicts">
            <ConflictChecker
              conflicts={conflicts}
              timeSlots={timeSlots}
              teachers={teachers}
              subjects={subjects}
              rooms={rooms}
            />
          </TabsContent>
          <TabsContent value="daily">
            <DayView
              classes={classes}
              setClasses={setClasses}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              days={days}
              timeSlots={timeSlots}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}