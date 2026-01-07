import teachers from './data/teachers.json';
import subjects from './data/subjects.json';
import courseData from './data/Course.json';
import Rooms from './data/rooms.json';
import TimeSlots from './data/timeslots.json';



// Simulate a network delay
const delay = (ms) => new Promise(res => setTimeout(res, ms));

const classes = [
  {
    id: 1,
    course_id: 1,
    teacher_id: 1,
    room_id: 101,
    timeslot_id: 1,
    day_of_week: "Monday",
    section: "A",
    created_date: "2025-09-01T09:00:00Z"
  },
  {
    id: 2,
    course_id: 2,
    teacher_id: 2,
    room_id: 102,
    timeslot_id: 2,
    day_of_week: "Tuesday",
    section: "B",
    created_date: "2025-09-02T11:00:00Z"
  },
  {
    id: 3,
    course_id: 3,
    teacher_id: 3,
    room_id: 103,
    timeslot_id: 3,
    day_of_week: "Wednesday",
    section: "C",
    created_date: "2025-09-03T14:00:00Z"
  },
  {
    id: 4,
    course_id: 4,
    teacher_id: 1,
    room_id: 104,
    timeslot_id: 4,
    day_of_week: "Thursday",
    section: "A",
    created_date: "2025-09-04T10:00:00Z"
  },
  {
    id: 5,
    course_id: 5,
    teacher_id: 2,
    room_id: 105,
    timeslot_id: 5,
    day_of_week: "Friday",
    section: "B",
    created_date: "2025-09-05T15:00:00Z"
  }
];

const Class = {
  create: async (newClass) => {
    await delay(300);
    const id = classes.length ? classes[classes.length - 1].id + 1 : 1;
    const created_date = new Date().toISOString();
    const classObj = { ...newClass, id, created_date };
    classes.push(classObj);
    return classObj;
  },
  update: async (id, updatedData) => {
    await delay(300);
    const idx = classes.findIndex(cls => cls.id === id);
    if (idx === -1) throw new Error("Class not found");
    classes[idx] = { ...classes[idx], ...updatedData };
    return classes[idx];
  },
  delete: async (id) => {
    await delay(300);
    const idx = classes.findIndex(cls => cls.id === id);
    if (idx === -1) throw new Error("Class not found");
    const removed = classes.splice(idx, 1)[0];
    return removed;
  },
  get: async (id) => {
    await delay(300);
    return classes.find(cls => cls.id === id) || null;
  },
  list: async (sortBy = "-created_date", limit = 10) => {
    await delay(300); // simulate network delay

    let sorted = [...classes];

    if (sortBy === "-created_date") {
      sorted.sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
      );
    }

    return sorted.slice(0, limit);
  }
};

 const Teacher = {
  list: async () => {
    await delay(300); // Simulate loading
    // The real API can sort, but we'll just return the array
    return teachers;
  },
  create: async (newTeacher) => {
    await delay(300);
    console.log("Creating new teacher (mock):", newTeacher);
    // In a real local setup, you'd update the state here
  },
  update: async (id, updatedData) => {
    await delay(300);
    console.log(`Updating teacher ${id} (mock):`, updatedData);
  }
};

 const Subject = {
  list: async () => {
    await delay(300);
    return subjects;
  },
  // Add create/update methods similarly...
};

 const Course = {
  list: async () => {
    await delay(300); // simulate API delay
    return courseData;
  }
};

 const Room = { 
  list: async () => { await delay(300); 
    return Rooms; } 
  };
 const TimeSlot = { 
  list: async () => { await delay(300); 
    return TimeSlots; } 
  };

// console.log("Rooms data:", Rooms);
// console.log("TimeSlots data:", TimeSlots);

// Combine them for the 'all' import
export default { Class ,Course ,Teacher, Subject, Room, TimeSlot };
export { Class ,Course ,Teacher, Subject, Room, TimeSlot };

