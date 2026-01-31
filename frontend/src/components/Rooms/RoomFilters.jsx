import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

const ROOM_TYPES = ["Classroom", "Laboratory", "Auditorium", "Seminar Room", "Computer Lab"];

export default function RoomFilters({ 
  filterType, 
  setFilterType, 
  filterBuilding, 
  setFilterBuilding, 
  buildings 
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-white/80 backdrop-blur-sm border-blue-200">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {ROOM_TYPES.map((type, index) => (
            <SelectItem key={`${type}-${index}`} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
        </Select>
      </div>
      
      <Select value={filterBuilding} onValueChange={setFilterBuilding}>
        <SelectTrigger className="w-36 bg-white/80 backdrop-blur-sm border-blue-200">
          <SelectValue placeholder="Building" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Buildings</SelectItem>
          {buildings.map((building, index) => (
            <SelectItem key={`${building}-${index}`} value={building}>
              {building}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}