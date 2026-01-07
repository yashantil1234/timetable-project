import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  BookOpen,
  Clock,
  Calendar,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  Bell,
  Settings,
  LogOut,
  Award,
  Target,
  TrendingUp,
  AlertTriangle,
  Plus
} from "lucide-react";

// Import components (these would be created separately)
import StatCard from "../../components/Dashboard/statCard";

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    attendedClasses: 0,
    upcomingClasses: 0,
    cgpa: 0,
    attendance: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [courses, setCourses] = useState([]);

  // Mock student data - replace with actual API calls
  const [studentData] = useState({
    id: "STU001",
    name: "John Doe",
    email: "john.doe@college.edu",
    phone: "+91 9876543210",
    year: "2nd Year",
    semester: "2nd Semester",
    department: "Computer Science",
    rollNumber: "CS21001",
    profileImage: null,
    address: "123 College Street, City Name",
    cgpa: 8.5,
    attendance: 85
  });

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls - replace with actual API endpoints
      const mockCourses = [
        {
          id: 1,
          name: "Data Structures and Algorithms",
          code: "CS201",
          credits: 4,
          faculty_name: "Dr. Sarah Johnson",
          faculty_id: "FAC001",
          classes_conducted: 28,
          classes_attended: 24,
          next_class: "Tomorrow 10:00 AM",
          room: "CS-101",
          time: "10:00-11:00"
        },
        {
          id: 2,
          name: "Database Management Systems",
          code: "CS202",
          credits: 3,
          faculty_name: "Prof. Michael Chen",
          faculty_id: "FAC002",
          classes_conducted: 25,
          classes_attended: 22,
          next_class: "Today 2:00 PM",
          room: "CS-102",
          time: "14:00-15:00"
        },
        {
          id: 3,
          name: "Operating Systems",
          code: "CS203",
          credits: 3,
          faculty_name: "Dr. Emily Rodriguez",
          faculty_id: "FAC003",
          classes_conducted: 30,
          classes_attended: 26,
          next_class: "Thursday 11:00 AM",
          room: "CS-103",
          time: "11:00-12:00"
        },
        {
          id: 4,
          name: "Computer Networks",
          code: "CS204",
          credits: 3,
          faculty_name: "Prof. David Kumar",
          faculty_id: "FAC004",
          classes_conducted: 22,
          classes_attended: 19,
          next_class: "Friday 9:00 AM",
          room: "CS-105",
          time: "09:00-10:00"
        },
        {
          id: 5,
          name: "Software Engineering",
          code: "CS205",
          credits: 3,
          faculty_name: "Dr. Lisa Thompson",
          faculty_id: "FAC005",
          classes_conducted: 26,
          classes_attended: 25,
          next_class: "Monday 1:00 PM",
          room: "CS-104",
          time: "13:00-14:00"
        }
      ];

      setCourses(mockCourses);

      // Filter today's classes
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const mockTodayClasses = mockCourses.filter(course => 
        course.next_class.includes("Today")
      ).map(course => ({
        ...course,
        subject: course.name,
        teacher: course.faculty_name,
        status: "upcoming"
      }));

      setTodayClasses(mockTodayClasses);

      // Calculate stats
      const totalClasses = mockCourses.reduce((sum, course) => sum + course.classes_conducted, 0);
      const attendedClasses = mockCourses.reduce((sum, course) => sum + course.classes_attended, 0);
      const upcomingToday = mockTodayClasses.length;

      setStats({
        totalCourses: mockCourses.length,
        totalClasses: totalClasses,
        attendedClasses: attendedClasses,
        upcomingClasses: upcomingToday,
        cgpa: studentData.cgpa,
        attendance: Math.round((attendedClasses / totalClasses) * 100)
      });

    } catch (error) {
      console.error("Error loading student data:", error);
    }
    setIsLoading(false);
  };

  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {studentData.name}!
            </h1>
            <p className="text-lg text-slate-600">{currentDay} • {currentTime}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{studentData.department}</Badge>
              <Badge variant="secondary">{studentData.year}</Badge>
              <Badge variant="secondary">{studentData.semester}</Badge>
            </div>
          </div>
          <StudentQuickActions />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <StatCard
            title="Enrolled Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            color="blue"
            isLoading={isLoading}
          />
          <StatCard
            title="CGPA"
            value={stats.cgpa}
            icon={Award}
            color="green"
            isLoading={isLoading}
          />
          <StatCard
            title="Attendance"
            value={`${stats.attendance}%`}
            icon={Target}
            color={stats.attendance >= 75 ? "green" : "red"}
            isLoading={isLoading}
          />
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={Calendar}
            color="purple"
            isLoading={isLoading}
          />
          <StatCard
            title="Classes Attended"
            value={stats.attendedClasses}
            icon={TrendingUp}
            color="orange"
            isLoading={isLoading}
          />
          <StatCard
            title="Today's Classes"
            value={stats.upcomingClasses}
            icon={Clock}
            color="pink"
            isLoading={isLoading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <StudentTodaySchedule 
              todayClasses={todayClasses}
              isLoading={isLoading}
              currentTime={currentTime}
            />
          </div>

          {/* Weekly Overview */}
          <div>
            <StudentWeeklyOverview courses={courses} />
          </div>

          {/* Course Overview */}
          <div className="lg:col-span-2">
            <StudentCourses courses={courses} isLoading={isLoading} />
          </div>

          {/* Profile Summary */}
          <div>
            <StudentProfileSummary student={studentData} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Student Quick Actions Component
function StudentQuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
        <BookOpen className="w-4 h-4" />
        View Courses
      </Button>
      <Button variant="outline" className="gap-2">
        <Calendar className="w-4 h-4" />
        Full Timetable
      </Button>
      <Button variant="outline" className="gap-2">
        <User className="w-4 h-4" />
        Profile
      </Button>
      <Button variant="ghost" size="sm">
        <Bell className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Student Today's Schedule Component
function StudentTodaySchedule({ todayClasses, isLoading, currentTime }) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-4 w-16" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayClasses.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No classes today</h3>
            <p className="text-gray-500">Enjoy your free day!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayClasses.map((classItem, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center min-w-[60px]">
                  <div className="font-mono text-sm font-bold text-blue-800">
                    {classItem.time}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{classItem.subject}</h4>
                  <p className="text-sm text-gray-600">{classItem.teacher}</p>
                  <p className="text-xs text-gray-500">{classItem.room}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={classItem.status === "completed" ? "secondary" : "default"}
                    className={classItem.status === "completed" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                  >
                    {classItem.status === "completed" ? "Completed" : "Upcoming"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Student Weekly Overview Component
function StudentWeeklyOverview({ courses }) {
  const attendanceData = courses.map(course => ({
    name: course.code,
    attendance: Math.round((course.classes_attended / course.classes_conducted) * 100)
  }));

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attendanceData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.name}</span>
                <span className={`text-sm font-bold ${
                  item.attendance >= 75 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.attendance}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    item.attendance >= 75 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(item.attendance, 100)}%` }}
                />
              </div>
              {item.attendance < 75 && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  Low attendance warning
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Student Courses Component
function StudentCourses({ courses, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          My Courses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {courses.map((course) => (
            <div key={course.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{course.name}</h4>
                <Badge variant="outline">{course.code}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span>{course.faculty_name} ({course.faculty_id})</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Classes: {course.classes_attended}/{course.classes_conducted}</span>
                <span className={`font-semibold ${
                  (course.classes_attended / course.classes_conducted * 100) >= 75 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {Math.round(course.classes_attended / course.classes_conducted * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Student Profile Summary Component
function StudentProfileSummary({ student }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          Profile Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg">{student.name}</h3>
          <p className="text-sm text-gray-600">{student.rollNumber}</p>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{student.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{student.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{student.year}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{student.cgpa}</p>
              <p className="text-xs text-gray-600">CGPA</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{student.attendance}%</p>
              <p className="text-xs text-gray-600">Attendance</p>
            </div>
          </div>
        </div>
        
        <Button variant="outline" className="w-full mt-4">
          <Settings className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
}