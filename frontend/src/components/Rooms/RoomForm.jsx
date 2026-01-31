import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save } from "lucide-react";

const ROOM_TYPES = ["Classroom", "Laboratory", "Auditorium", "Seminar Room", "Computer Lab"];

export default function RoomForm({ room, onSubmit, onCancel }) {
  // Parse room name into building and number for editing
  const parseRoomName = (name) => {
    if (!name) return { building: '', number: '' };
    const parts = name.split('-');
    if (parts.length >= 2) {
      const number = parts.pop();
      const building = parts.join('-');
      return { building, number };
    }
    return { building: '', number: name };
  };

  const parsedName = room?.name ? parseRoomName(room.name) : { building: '', number: '' };

  const [formData, setFormData] = useState({
    number: parsedName.number || room?.number || '',
    building: parsedName.building || room?.building || '',
    capacity: room?.capacity || 30,
    type: room?.type || 'Classroom',
    floor: room?.floor || 1,
    facilities: room?.facilities?.join(', ') || room?.resources || '',
    is_active: room?.is_active !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      name: `${formData.building}-${formData.number}`,
      capacity: formData.capacity,
      resources: formData.facilities
        ? formData.facilities.split(',').map(s => s.trim()).filter(s => s).join(', ')
        : ''
    };
    onSubmit(submitData);
  };

  return (
    <Card className="mb-8 bg-white/90 backdrop-blur-sm border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {room ? 'Edit Room' : 'Add New Room'}
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="number">Room Number *</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                placeholder="Enter room number (e.g., 101, A-204)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">Building *</Label>
              <Input
                id="building"
                value={formData.building}
                onChange={(e) => setFormData({...formData, building: e.target.value})}
                placeholder="Enter building name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Room Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({...formData, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="500"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                placeholder="30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                min="0"
                max="20"
                value={formData.floor}
                onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                placeholder="1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="facilities">Available Facilities</Label>
            <Textarea
              id="facilities"
              value={formData.facilities}
              onChange={(e) => setFormData({...formData, facilities: e.target.value})}
              placeholder="Enter facilities separated by commas (e.g., Projector, Whiteboard, AC, WiFi)"
              className="h-20"
            />
            <p className="text-sm text-gray-500">Enter facilities separated by commas</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
            />
            <Label htmlFor="is_active">Room is available for scheduling</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {room ? 'Update Room' : 'Add Room'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}