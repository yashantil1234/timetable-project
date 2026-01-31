import React, { useState, useEffect } from "react";
import ApiService from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowRightLeft,
  UserCheck,
  UserX,
  FileText,
  Bell,
  Settings,
  LogOut,
  BookOpen,
  GraduationCap,
  AlertTriangle
} from "lucide-react";

export default function TeacherDashboard({ onLogout }) {
  const [stats, setStats] = useState({
    totalClasses: 0,
    todayClasses: 0,
    pendingSwaps: 0,
    leaveRequests: 0
  });
  const [timetable, setTimetable] = useState([]);
  const [roomStatus, setRoomStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState({
    name: "Teacher",
    email: "",
    department: "",
    employeeId: ""
  });

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load teacher timetable
      let timetableResponse = [];
      try {
        const response = await ApiService.getTeacherTimetable();
        // API returns {timetable: [...], teacher_name: "...", department: "..."}
        timetableResponse = (response && response.timetable) ? response.timetable : [];
      } catch (timetableError) {
        console.warn("Could not load teacher timetable:", timetableError.message);
        // Continue with empty timetable - teacher might not have faculty record yet
        timetableResponse = [];
      }
      setTimetable(timetableResponse);

      // Load room status
      let roomStatusResponse = [];
      try {
        const response = await ApiService.getRoomStatus();
        // API returns {free_rooms, unmarked_rooms, occupied_rooms, total_rooms}
        // Combine all rooms into a single array with status
        if (response && typeof response === 'object') {
          const allRooms = [
            ...(response.free_rooms || []).map(room => ({ ...room, status: 'free' })),
            ...(response.unmarked_rooms || []).map(room => ({ ...room, status: 'unmarked' })),
            ...(response.occupied_rooms || []).map(room => ({ ...room, status: 'occupied' }))
          ];
          roomStatusResponse = allRooms;
        } else {
          roomStatusResponse = Array.isArray(response) ? response : [];
        }
      } catch (roomError) {
        console.warn("Could not load room status:", roomError.message);
        roomStatusResponse = [];
      }
      setRoomStatus(roomStatusResponse);

      // Load swap requests
      let swapRequests = [];
      try {
        const response = await ApiService.getTeacherSwapRequests();
        swapRequests = response || [];
      } catch (swapError) {
        console.warn("Could not load swap requests:", swapError.message);
        swapRequests = [];
      }

      // Process stats
      const todayClasses = getTodayClasses(timetableResponse);
      const pendingSwaps = swapRequests ? swapRequests.filter(req => req.status === 'pending').length : 0;

      setStats({
        totalClasses: timetableResponse ? timetableResponse.length : 0,
        todayClasses: todayClasses.length,
        pendingSwaps,
        leaveRequests: 0 // Would come from leave API
      });

      // Set teacher info from localStorage or API
      const user = ApiService.getCurrentUser();
      setTeacherInfo({
        name: user.full_name || "Teacher User",
        email: user.email || "teacher@college.edu",
        department: user.department || "Computer Science",
        employeeId: user.user_id || "T001"
      });

    } catch (error) {
      console.error("Error loading teacher data:", error);
      setError("Failed to load teacher data. Please try again.");
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

  const handleRoomStatusChange = async (roomId, status) => {
    try {
      await ApiService.markRoom(roomId, status);
      // Refresh room status
      const updatedStatus = await ApiService.getRoomStatus();
      setRoomStatus(updatedStatus || []);
    } catch (error) {
      console.error("Error updating room status:", error);
    }
  };

  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const todayClasses = getTodayClasses(timetable);

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-x-4">
                <Button onClick={loadTeacherData}>Try Again</Button>
                <Button variant="outline" onClick={onLogout}>Logout</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {teacherInfo.name}!
            </h1>
            <p className="text-lg text-slate-600">{currentDay} • {currentTime}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{teacherInfo.department}</Badge>
              <Badge variant="secondary">ID: {teacherInfo.employeeId}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <ArrowRightLeft className="w-4 h-4" />
              Swap Classes
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Apply Leave
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={BookOpen}
            color="green"
            isLoading={isLoading}
          />
          <StatCard
            title="Today's Classes"
            value={stats.todayClasses}
            icon={Clock}
            color="blue"
            isLoading={isLoading}
          />
          <StatCard
            title="Pending Swaps"
            value={stats.pendingSwaps}
            icon={ArrowRightLeft}
            color="orange"
            isLoading={isLoading}
          />
          <StatCard
            title="Leave Requests"
            value={stats.leaveRequests}
            icon={FileText}
            color="purple"
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

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>

          {/* Room Status */}
          <div className="lg:col-span-2">
            <RoomStatusCard
              rooms={roomStatus}
              onStatusChange={handleRoomStatusChange}
              isLoading={isLoading}
            />
          </div>

          {/* Weekly Overview */}
          <div>
            <WeeklyOverview
              timetable={timetable}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ title, value, icon: Icon, color, isLoading }) {
  const colorMap = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    orange: "bg-orange-100 text-orange-800",
    purple: "bg-purple-100 text-purple-800"
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
          <Clock className="w-5 h-5 text-green-600" />
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
              <div key={index} className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center min-w-[80px]">
                  <div className="font-mono text-sm font-bold text-green-800">
                    {classItem.slot || 'N/A'}
                  </div>
                  <div className="text-xs text-green-600">
                    {classItem.room || 'TBA'}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{classItem.course || 'Unknown Course'}</h4>
                  <p className="text-sm text-gray-600">{classItem.section || 'Unknown Section'}</p>
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

// Quick Actions Component
function QuickActions() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start gap-2" variant="outline">
          <ArrowRightLeft className="w-4 h-4" />
          Request Class Swap
        </Button>
        <Button className="w-full justify-start gap-2" variant="outline">
          <FileText className="w-4 h-4" />
          Apply for Leave
        </Button>
        <Button className="w-full justify-start gap-2" variant="outline">
          <Bell className="w-4 h-4" />
          View Notifications
        </Button>
        <Button className="w-full justify-start gap-2" variant="outline">
          <Users className="w-4 h-4" />
          My Profile
        </Button>
      </CardContent>
    </Card>
  );
}

// Room Status Card Component
function RoomStatusCard({ rooms, onStatusChange, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Room Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
          <MapPin className="w-5 h-5 text-purple-600" />
          Room Status Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No rooms available</h3>
              <p className="text-gray-500">Room status will appear here</p>
            </div>
          ) : (
            rooms.map((room, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{room.name || `Room ${room.id}`}</h4>
                  <p className="text-sm text-gray-600">{room.location || 'Unknown location'}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={room.status === 'occupied' ? 'default' : 'outline'}
                    onClick={() => onStatusChange(room.id, 'occupied')}
                    className="gap-1"
                  >
                    <UserCheck className="w-3 h-3" />
                    Occupied
                  </Button>
                  <Button
                    size="sm"
                    variant={room.status === 'vacant' ? 'default' : 'outline'}
                    onClick={() => onStatusChange(room.id, 'vacant')}
                    className="gap-1"
                  >
                    <UserX className="w-3 h-3" />
                    Vacant
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Weekly Overview Component
function WeeklyOverview({ timetable, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
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

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-600" />
          Weekly Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {daysOfWeek.map(day => {
            const dayClasses = (timetable && Array.isArray(timetable)) ? timetable.filter(item =>
              item.day && item.day.toLowerCase() === day.toLowerCase()
            ) : [];

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
                          <p className="text-xs text-gray-600">{classItem.section}</p>
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
