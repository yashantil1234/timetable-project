import React, { useState } from "react";
import { Button } from "@/components/ui/button";
<import>ApiService from '/services/api';</import>


export default function ScheduleForm({ slot, teachers, subjects, rooms, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    slot || { day: "", start_time: "", end_time: "", teacher_id: "", subject_id: "", room_id: "" }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold">{slot ? "Edit Schedule" : "Add Schedule"}</h2>

      <div>
        <label className="block mb-1">Day</label>
        <select name="day" value={formData.day} onChange={handleChange} className="w-full border rounded p-2">
          <option value="">Select Day</option>
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
          <option value="Saturday">Saturday</option>
        </select>
      </div>

      <div>
        <label className="block mb-1">Start Time</label>
        <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full border rounded p-2" />
      </div>

      <div>
        <label className="block mb-1">End Time</label>
        <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full border rounded p-2" />
      </div>

      <div>
        <label className="block mb-1">Teacher</label>
        <select name="teacher_id" value={formData.teacher_id} onChange={handleChange} className="w-full border rounded p-2">
          <option value="">Select Teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Subject</label>
        <select name="subject_id" value={formData.subject_id} onChange={handleChange} className="w-full border rounded p-2">
          <option value="">Select Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1">Room</label>
        <select name="room_id" value={formData.room_id} onChange={handleChange} className="w-full border rounded p-2">
          <option value="">Select Room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
          {slot ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
