import React, { useState, useEffect } from "react";
import ApiService from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  BookOpen,
  Award,
  Target,
  TrendingUp,
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Bell,
  Settings,
  LogOut,
  AlertTriangle
} from "lucide-react";

export default function StudentDashboard({ onLogout }) {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    attendedClasses: 0,
    upcomingClasses: 0,
    cgpa: 0,
    attendance: 0
  });
  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    name: "Student",
    email: "",
    department: "",
    year: "",
    semester: "",
    rollNumber: "",
    phone: ""
  });

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load student timetable
      const timetableResponse = await ApiService.getStudentTimetable();
      // Handle different response formats
      let timetableData = [];
      if (Array.isArray(timetableResponse)) {
        timetableData = timetableResponse;
      } else if (timetableResponse?.timetable && Array.isArray(timetableResponse.timetable)) {
        timetableData = timetableResponse.timetable;
      }
      setTimetable(timetableData);

      // Process timetable data for stats
      const timetableArray = Array.isArray(timetableData) ? timetableData : [];
      const todayClasses = getTodayClasses(timetableArray);
      const courseStats = calculateCourseStats(timetableArray);

      setStats({
        totalCourses: courseStats.totalCourses,
        totalClasses: courseStats.totalClasses,
        attendedClasses: courseStats.attendedClasses,
        upcomingClasses: todayClasses.length,
        cgpa: 8.5, // This would come from student record
        attendance: courseStats.attendancePercentage
      });

      // Extract student info from context or API
      const user = ApiService.getCurrentUser();
      setStudentInfo({
        name: user.full_name || "Student User",
        email: user.email || "student@college.edu",
        department: user.department || "Computer Science",
        year: "2nd Year",
        semester: "Current Semester",
        rollNumber: user.user_id || "CS21001",
        phone: "+91 9876543210"
      });

    } catch (error) {
      console.error("Error loading student data:", error);
      setError("Failed to load student data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayClasses = (timetable) => {
    if (!timetable || !Array.isArray(timetable)) return [];

    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return timetable.filter(item =>
      item.day && item.day.toLowerCase() === today.toLowerCase()
    );
  };

  const calculateCourseStats = (timetable) => {
    if (!timetable || !Array.isArray(timetable)) {
      return { totalCourses: 0, totalClasses: 0, attendedClasses: 0, attendancePercentage: 0 };
    }

    const uniqueCourses = new Set(timetable.map(item => item.course)).size;

    return {
      totalCourses: uniqueCourses,
      totalClasses: timetable.length * 10, // Estimated
      attendedClasses: Math.floor(timetable.length * 8.5), // Estimated 85% attendance
      attendancePercentage: 85 // Would be calculated from actual attendance data
    };
  };

  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const todayClasses = getTodayClasses(timetable);

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-x-4">
                <Button onClick={loadStudentData}>Try Again</Button>
                <Button variant="outline" onClick={onLogout}>Logout</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {studentInfo.name}!
            </h1>
            <p className="text-lg text-slate-600">{currentDay} • {currentTime}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{studentInfo.department}</Badge>
              <Badge variant="secondary">{studentInfo.year}</Badge>
              <Badge variant="secondary">{studentInfo.semester}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <BookOpen className="w-4 h-4" />
              View Timetable
            </Button>
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Full Schedule
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <StatCard
            title="Total Courses"
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
            <TodaySchedule
              classes={todayClasses}
              isLoading={isLoading}
            />
          </div>

          {/* Profile Summary */}
          <div>
            <ProfileSummary student={studentInfo} />
          </div>

          {/* Weekly Timetable */}
          <div className="lg:col-span-2">
            <WeeklyTimetable
              timetable={timetable}
              isLoading={isLoading}
            />
          </div>

          {/* Announcements */}
          <div>
            <AnnouncementsCard />
          </div>
        </div>
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ title, value, icon: Icon, color, isLoading }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
    orange: "bg-orange-100 text-orange-800",
    pink: "bg-pink-100 text-pink-800"
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Today's Schedule Component
function TodaySchedule({ classes, isLoading }) {
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
        {classes.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No classes today</h3>
            <p className="text-gray-500">Enjoy your free day!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((classItem, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center min-w-[80px]">
                  <div className="font-mono text-sm font-bold text-blue-800">
                    {classItem.slot || 'N/A'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {classItem.room || 'TBA'}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{classItem.course || 'Unknown Course'}</h4>
                  <p className="text-sm text-gray-600">{classItem.faculty || 'Unknown Faculty'}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-orange-100 text-orange-800">
                    Scheduled
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

// Weekly Timetable Component
function WeeklyTimetable({ timetable, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure timetable is always an array with comprehensive defensive programming
  let safeTimetable = [];
  try {
    if (Array.isArray(timetable)) {
      safeTimetable = timetable;
    } else if (timetable && typeof timetable === 'object') {
      // Check for nested timetable property
      if (Array.isArray(timetable.timetable)) {
        safeTimetable = timetable.timetable;
      } else {
        // Try to extract array from object values
        const values = Object.values(timetable);
        const arrays = values.filter(val => Array.isArray(val));
        if (arrays.length > 0) {
          safeTimetable = arrays[0];
        } else {
          // Last resort: check if any property contains an array
          for (const key in timetable) {
            if (Array.isArray(timetable[key])) {
              safeTimetable = timetable[key];
              break;
            }
          }
        }
      }
    }
    // Final fallback
    if (!Array.isArray(safeTimetable)) {
      safeTimetable = [];
    }
  } catch (error) {
    console.error('Error processing timetable data:', error, timetable);
    safeTimetable = [];
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Weekly Timetable
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {daysOfWeek.map(day => {
            let dayClasses = [];
            try {
              dayClasses = safeTimetable.filter(item =>
                item && typeof item === 'object' && item.day && item.day.toLowerCase() === day.toLowerCase()
              );
            } catch (error) {
              console.error('Error filtering timetable for day:', day, error);
              dayClasses = [];
            }

            return (
              <div key={day} className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{day}</h4>
                {dayClasses.length === 0 ? (
                  <p className="text-sm text-gray-500">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {dayClasses.map((classItem, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{classItem.course}</p>
                          <p className="text-xs text-gray-600">{classItem.faculty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{classItem.slot}</p>
                          <p className="text-xs text-gray-600">{classItem.room}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Profile Summary Component
function ProfileSummary({ student }) {
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
            <span className="text-gray-700 truncate">{student.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{student.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{student.year}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 text-xs">{student.department}</span>
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

// Announcements Component
function AnnouncementsCard() {
  // Mock announcements - in real app, this would come from API
  const announcements = [
    {
      id: 1,
      title: "Mid-term Examination Schedule",
      message: "Mid-term examinations will begin from March 15th. Check your timetable for details.",
      type: "Academic",
      date: "2024-03-01"
    },
    {
      id: 2,
      title: "Library Hours Extended",
      message: "Library will remain open until 10 PM during exam period.",
      type: "General",
      date: "2024-02-28"
    }
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-600" />
          Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center py-4">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 text-sm">No announcements</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  {announcement.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  {announcement.message}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{announcement.type}</span>
                  <span>{new Date(announcement.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
