import axios from "axios";
import teachers from "./data/teachers.json";
import subjects from "./data/subjects.json";
import courseData from "./data/Course.json";
import roomsData from "./data/rooms.json";
import timeSlotsData from "./data/timeslots.json";

// ----------------------------
// Axios API Client Setup
// ----------------------------
const API = axios.create({
  baseURL: "http://localhost:5000", // Change if your backend runs on a different port
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ----------------------------
// Utility Functions
// ----------------------------

// Simulate network delay for mock functions
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ----------------------------
// Mock Data Store
// ----------------------------
let classes = [
  // Example initial data
  { id: 1, name: "Math 101", teacherId: 1, subjectId: 1, created_date: new Date().toISOString() },
];

// ----------------------------
// Mock API Implementations
// ----------------------------
export const Class = {
  create: async (newClass) => {
    await delay(300);
    const id = classes.length ? Math.max(...classes.map((c) => c.id)) + 1 : 1;
    const created_date = new Date().toISOString();
    const classObj = { ...newClass, id, created_date };
    classes.push(classObj);
    return classObj;
  },

  update: async (id, updatedData) => {
    await delay(300);
    const index = classes.findIndex((cls) => cls.id === id);
    if (index === -1) throw new Error("Class not found");
    classes[index] = { ...classes[index], ...updatedData };
    return classes[index];
  },

  delete: async (id) => {
    await delay(300);
    const index = classes.findIndex((cls) => cls.id === id);
    if (index === -1) throw new Error("Class not found");
    return classes.splice(index, 1)[0];
  },

  get: async (id) => {
    await delay(300);
    return classes.find((cls) => cls.id === id) || null;
  },

  list: async (sortBy = "-created_date", limit = 10) => {
    await delay(300);
    let sorted = [...classes];
    if (sortBy === "-created_date") {
      sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    return sorted.slice(0, limit);
  },
};

export const Teacher = {
  list: async () => {
    await delay(300);
    return teachers;
  },
};

export const Subject = {
  list: async () => {
    await delay(300);
    return subjects;
  },
};

export const Course = {
  list: async () => {
    await delay(300);
    return courseData;
  },
};

export const Room = {
  list: async () => {
    await delay(300);
    return roomsData;
  },
};

export const TimeSlot = {
  list: async () => {
    await delay(300);
    return timeSlotsData;
  },
};

// ----------------------------
// Real Backend API Calls
// ----------------------------
export const loginUser = async (credentials) => {
  try {
    const response = await API.post("/login", credentials);
    return response.data; // { token, user }
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

// ----------------------------
// Default Export
// ----------------------------
export default {
  Class,
  Teacher,
  Subject,
  Course,
  Room,
  TimeSlot,
  loginUser
};      