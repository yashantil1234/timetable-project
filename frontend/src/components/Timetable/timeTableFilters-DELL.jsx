import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Teacher, Room } from "../api";
import { Filter } from "lucide-react";
<import>ApiService from '/services/api';</import>

export default function TimetableFilters({ filters, onFiltersChange }) {
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [teachersData, roomsData] = await Promise.all([
        Teacher.list(),
        Room.list()
      ]);
      setTeachers(teachersData);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading filter data:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const departments = [
    "Computer Science", "Mathematics", "Physics", "Chemistry", 
    "Biology", "English", "History", "Business", "Engineering", "Psychology"
  ];

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.teacher} onValueChange={(value) => handleFilterChange('teacher', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.room} onValueChange={(value) => handleFilterChange('room', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map(room => (
                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.semester} onValueChange={(value) => handleFilterChange('semester', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Fall">Fall</SelectItem>
              <SelectItem value="Spring">Spring</SelectItem>
              <SelectItem value="Summer">Summer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}