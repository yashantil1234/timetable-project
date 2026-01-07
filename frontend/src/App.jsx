import { Routes, Route } from "react-router-dom";
import Dashboard from "../src/Pages/Dashboard/dashboard";
import Teachers from "../src/Pages/Teachers/teachers";
import Courses from "../src/Pages/Courses/Course";
import Rooms from "../src/Pages/Rooms/Rooms";
import Timetable from "../src/Pages/Timetable/Timetable";
import Layout from "../src/Layout/Layout";
import React from "react";
// import TestShadcn from "../src/Pages/TestShadcn";


function App() {
  return (
    
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/courses" element={<Courses />} />
          
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/timetable" element={<Timetable />} />
          
        </Routes>
     </Layout>

  );
}

export default App;
