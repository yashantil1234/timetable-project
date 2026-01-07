// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Badge } from "@/components/ui/badge";
// import { 
//   User, 
//   Lock, 
//   Eye, 
//   EyeOff, 
//   AlertCircle, 
//   BookOpen,
//   Clock,
//   Calendar,
//   Mail,
//   Phone,
//   GraduationCap,
//   Award,
//   Target,
//   TrendingUp,
//   AlertTriangle,
//   Bell,
//   Settings,
//   MapPin
// } from "lucide-react";

// // API Service
// class ApiService {
//   constructor() {
//     this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
//     this.token = localStorage.getItem('token');
//   }

//   getHeaders(includeAuth = true) {
//     const headers = { 'Content-Type': 'application/json' };
//     if (includeAuth && this.token) {
//       headers['x-access-token'] = this.token;
//     }
//     return headers;
//   }

//   async makeRequest(endpoint, options = {}) {
//     const url = `${this.baseURL}${endpoint}`;
//     const config = {
//       ...options,
//       headers: { ...this.getHeaders(options.auth !== false), ...options.headers }
//     };

//     try {
//       const response = await fetch(url, config);
//       const data = await response.json();
      
//       if (!response.ok) {
//         throw new Error(data.error || `HTTP error! status: ${response.status}`);
//       }
//       return data;
//     } catch (error) {
//       console.error('API Request failed:', error);
//       throw error;
//     }
//   }

//   async login(username, password) {
//     const data = await this.makeRequest('/login', {
//       method: 'POST',
//       body: JSON.stringify({ username, password }),
//       auth: false,
//     });

//     if (data.token) {
//       this.token = data.token;
//       localStorage.setItem('token', data.token);
//       localStorage.setItem('user_role', data.role);
//       localStorage.setItem('user_id', data.user_id);
//     }
//     return data;
//   }

//   async getStudentTimetable() {
//     return this.makeRequest('/student/timetable');
//   }

//   async getAnnouncements() {
//     return this.makeRequest('/api/announcements');
//   }

//   getUserRole() {
//     return localStorage.getItem('user_role');
//   }

//   isAuthenticated() {
//     return !!this.token;
//   }

//   logout() {
//     this.token = null;
//     localStorage.removeItem('token');
//     localStorage.removeItem('user_role');
//     localStorage.removeItem('user_id');
//   }
// }

// const apiService = new ApiService();

// // Login Component
// function LoginComponent({ onLogin }) {
//   const [formData, setFormData] = useState({
//     username: '',
//     password: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const response = await apiService.login(formData.username, formData.password);
      
//       if (response && response.token) {
//         onLogin(response.role);
//       }
//     } catch (error) {
//       setError(error.message || 'Login failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
//       <Card className="w-full max-w-md shadow-xl">
//         <CardHeader className="text-center pb-6">
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <User className="w-8 h-8 text-blue-600" />
//           </div>
//           <CardTitle className="text-2xl font-bold text-gray-900">
//             Timetable Management System
//           </CardTitle>
//           <p className="text-gray-600 mt-2">Sign in to your account</p>
//         </CardHeader>
        
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <label htmlFor="username" className="text-sm font-medium text-gray-700">
//                 Username
//               </label>
//               <div className="relative">
//                 <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
//                 <input
//                   id="username"
//                   type="text"
//                   placeholder="Enter your username"
//                   value={formData.username}
//                   onChange={(e) => handleInputChange('username', e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label htmlFor="password" className="text-sm font-medium text-gray-700">
//                 Password
//               </label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
//                 <input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Enter your password"
//                   value={formData.password}
//                   onChange={(e) => handleInputChange('password', e.target.value)}
//                   className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
//                 >
//                   {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                 </button>
//               </div>
//             </div>

//             {error && (
//               <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <AlertCircle className="w-4 h-4 text-red-500" />
//                 <span className="text-sm text-red-700">{error}</span>
//               </div>
//             )}

//             <Button 
//               type="submit" 
//               disabled={loading || !formData.username || !formData.password}
//               className="w-full bg-blue-600 hover:bg-blue-700"
//             >
//               {loading ? 'Signing in...' : 'Sign In'}
//             </Button>
//           </form>

//           <div className="mt-6 pt-4 border-t border-gray-200">
//             <p className="text-xs text-gray-500 text-center">
//               Demo credentials: admin/admin123 (Admin) | Create student account via admin panel
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// // StatCard Component
// function StatCard({ title, value, icon: Icon, color, isLoading }) {
//   const colorMap = {
//     blue: "bg-blue-100 text-blue-800",
//     green: "bg-green-100 text-green-800",
//     red: "bg-red-100 text-red-800",
//     purple: "bg-purple-100 text-purple-800",
//     orange: "bg-orange-100 text-orange-800",
//     pink: "bg-pink-100 text-pink-800"
//   };

//   if (isLoading) {
//     return (
//       <Card className="shadow-lg">
//         <CardContent className="p-6">
//           <div className="flex items-center justify-between">
//             <div className="space-y-2">
//               <Skeleton className="h-4 w-20" />
//               <Skeleton className="h-8 w-16" />
//             </div>
//             <Skeleton className="h-8 w-8 rounded-full" />
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className="shadow-lg hover:shadow-xl transition-shadow">
//       <CardContent className="p-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-sm font-medium text-gray-600">{title}</p>
//             <p className="text-3xl font-bold text-gray-900">{value}</p>
//           </div>
//           <div className={`p-3 rounded-full ${colorMap[color] || colorMap.blue}`}>
//             <Icon className="w-6 h-6" />
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// // Student Dashboard Component
// function StudentDashboard({ onLogout }) {
//   const [stats, setStats] = useState({
//     totalCourses: 0,
//     totalClasses: 0,
//     attendedClasses: 0,
//     upcomingClasses: 0,
//     cgpa: 0,
//     attendance: 0
//   });
  
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [timetableData, setTimetableData] = useState([]);
//   const [announcements, setAnnouncements] = useState([]);
//   const [studentInfo, setStudentInfo] = useState({
//     name: "Student",
//     email: "",
//     department: "",
//     year: "",
//     semester: "",
//     rollNumber: "",
//     phone: ""
//   });

//   useEffect(() => {
//     loadStudentData();
//   }, []);

//   const loadStudentData = async () => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       // Load student timetable
//       const timetableResponse = await apiService.getStudentTimetable();
//       setTimetableData(timetableResponse || []);

//       // Load announcements
//       try {
//         const announcementsResponse = await apiService.getAnnouncements();
//         setAnnouncements(announcementsResponse || []);
//       } catch (err) {
//         console.warn('Could not load announcements:', err.message);
//       }

//       // Process timetable data for stats
//       const todayClasses = getTodayClasses(timetableResponse);
//       const courseStats = calculateCourseStats(timetableResponse);

//       setStats({
//         totalCourses: courseStats.totalCourses,
//         totalClasses: courseStats.totalClasses,
//         attendedClasses: courseStats.attendedClasses,
//         upcomingClasses: todayClasses.length,
//         cgpa: 8.5, // This would come from student record
//         attendance: courseStats.attendancePercentage
//       });

//       // Extract student info from context or API
//       // In real implementation, this would come from a separate student info endpoint
//       setStudentInfo({
//         name: "Student User", // Would come from user context
//         email: "student@college.edu",
//         department: "Computer Science",
//         year: "2nd Year", 
//         semester: "Current Semester",
//         rollNumber: "CS21001",
//         phone: "+91 9876543210"
//       });

//     } catch (error) {
//       console.error("Error loading student data:", error);
//       setError("Failed to load student data. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getTodayClasses = (timetable) => {
//     if (!timetable || !Array.isArray(timetable)) return [];
    
//     const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
//     return timetable.filter(item => 
//       item.day && item.day.toLowerCase() === today.toLowerCase()
//     );
//   };

//   const calculateCourseStats = (timetable) => {
//     if (!timetable || !Array.isArray(timetable)) {
//       return { totalCourses: 0, totalClasses: 0, attendedClasses: 0, attendancePercentage: 0 };
//     }

//     const uniqueCourses = new Set(timetable.map(item => item.course)).size;
    
//     return {
//       totalCourses: uniqueCourses,
//       totalClasses: timetable.length * 10, // Estimated
//       attendedClasses: Math.floor(timetable.length * 8.5), // Estimated 85% attendance
//       attendancePercentage: 85 // Would be calculated from actual attendance data
//     };
//   };

//   const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
//   const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//   const todayClasses = getTodayClasses(timetableData);

//   if (error) {
//     return (
//       <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
//         <div className="max-w-7xl mx-auto">
//           <Card className="shadow-lg">
//             <CardContent className="p-8 text-center">
//               <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
//               <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
//               <p className="text-gray-600 mb-4">{error}</p>
//               <div className="space-x-4">
//                 <Button onClick={loadStudentData}>Try Again</Button>
//                 <Button variant="outline" onClick={onLogout}>Logout</Button>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
//       <div className="max-w-7xl mx-auto space-y-8">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
//           <div>
//             <h1 className="text-4xl font-bold text-slate-900 mb-2">
//               Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {studentInfo.name}!
//             </h1>
//             <p className="text-lg text-slate-600">{currentDay} • {currentTime}</p>
//             <div className="flex gap-2 mt-2">
//               <Badge variant="secondary">{studentInfo.department}</Badge>
//               <Badge variant="secondary">{studentInfo.year}</Badge>
//               <Badge variant="secondary">{studentInfo.semester}</Badge>
//             </div>
//           </div>
//           <div className="flex flex-wrap gap-3">
//             <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
//               <BookOpen className="w-4 h-4" />
//               View Timetable
//             </Button>
//             <Button variant="outline" className="gap-2">
//               <Calendar className="w-4 h-4" />
//               Full Schedule
//             </Button>
//             <Button variant="ghost" size="sm">
//               <Bell className="w-4 h-4" />
//             </Button>
//             <Button variant="ghost" size="sm">
//               <Settings className="w-4 h-4" />
//             </Button>
//             <Button variant="outline" size="sm" onClick={onLogout}>
//               Logout
//             </Button>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
//           <StatCard
//             title="Total Courses"
//             value={stats.totalCourses}
//             icon={BookOpen}
//             color="blue"
//             isLoading={isLoading}
//           />
//           <StatCard
//             title="CGPA"
//             value={stats.cgpa}
//             icon={Award}
//             color="green"
//             isLoading={isLoading}
//           />
//           <StatCard
//             title="Attendance"
//             value={`${stats.attendance}%`}
//             icon={Target}
//             color={stats.attendance >= 75 ? "green" : "red"}
//             isLoading={isLoading}
//           />
//           <StatCard
//             title="Total Classes"
//             value={stats.totalClasses}
//             icon={Calendar}
//             color="purple"
//             isLoading={isLoading}
//           />
//           <StatCard
//             title="Classes Attended"
//             value={stats.attendedClasses}
//             icon={TrendingUp}
//             color="orange"
//             isLoading={isLoading}
//           />
//           <StatCard
//             title="Today's Classes"
//             value={stats.upcomingClasses}
//             icon={Clock}
//             color="pink"
//             isLoading={isLoading}
//           />
//         </div>

//         {/* Main Content Grid */}
//         <div className="grid lg:grid-cols-3 gap-8">
//           {/* Today's Schedule */}
//           <div className="lg:col-span-2">
//             <TodaySchedule 
//               classes={todayClasses}
//               isLoading={isLoading}
//             />
//           </div>

//           {/* Profile Summary */}
//           <div>
//             <ProfileSummary student={studentInfo} />
//           </div>

//           {/* Weekly Timetable */}
//           <div className="lg:col-span-2">
//             <WeeklyTimetable 
//               timetable={timetableData}
//               isLoading={isLoading}
//             />
//           </div>

//           {/* Announcements */}
//           <div>
//             <AnnouncementsCard announcements={announcements} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Today's Schedule Component
// function TodaySchedule({ classes, isLoading }) {
//   if (isLoading) {
//     return (
//       <Card className="shadow-lg">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Clock className="w-5 h-5" />
//             Today's Schedule
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {[...Array(3)].map((_, i) => (
//             <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
//               <Skeleton className="h-4 w-16" />
//               <div className="flex-1">
//                 <Skeleton className="h-4 w-32 mb-2" />
//                 <Skeleton className="h-3 w-24" />
//               </div>
//               <Skeleton className="h-4 w-16" />
//             </div>
//           ))}
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className="shadow-lg">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Clock className="w-5 h-5 text-blue-600" />
//           Today's Schedule
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         {classes.length === 0 ? (
//           <div className="text-center py-8">
//             <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//             <h3 className="text-lg font-semibold text-gray-600 mb-2">No classes today</h3>
//             <p className="text-gray-500">Enjoy your free day!</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {classes.map((classItem, index) => (
//               <div key={index} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
//                 <div className="text-center min-w-[80px]">
//                   <div className="font-mono text-sm font-bold text-blue-800">
//                     {classItem.slot || 'N/A'}
//                   </div>
//                   <div className="text-xs text-blue-600">
//                     {classItem.room || 'TBA'}
//                   </div>
//                 </div>
//                 <div className="flex-1">
//                   <h4 className="font-semibold text-gray-900">{classItem.course || 'Unknown Course'}</h4>
//                   <p className="text-sm text-gray-600">{classItem.faculty || 'Unknown Faculty'}</p>
//                 </div>
//                 <div className="text-right">
//                   <Badge className="bg-orange-100 text-orange-800">
//                     Scheduled
//                   </Badge>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// // Weekly Timetable Component
// function WeeklyTimetable({ timetable, isLoading }) {
//   if (isLoading) {
//     return (
//       <Card className="shadow-lg">
//         <CardHeader>
//           <CardTitle>Weekly Timetable</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {[...Array(5)].map((_, i) => (
//               <Skeleton key={i} className="h-16 w-full" />
//             ))}
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

//   return (
//     <Card className="shadow-lg">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Calendar className="w-5 h-5 text-purple-600" />
//           Weekly Timetable
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-4 max-h-96 overflow-y-auto">
//           {daysOfWeek.map(day => {
//             const dayClasses = timetable.filter(item => 
//               item.day && item.day.toLowerCase() === day.toLowerCase()
//             );

//             return (
//               <div key={day} className="border rounded-lg p-4">
//                 <h4 className="font-semibold text-gray-900 mb-2">{day}</h4>
//                 {dayClasses.length === 0 ? (
//                   <p className="text-sm text-gray-500">No classes</p>
//                 ) : (
//                   <div className="space-y-2">
//                     {dayClasses.map((classItem, index) => (
//                       <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
//                         <div>
//                           <p className="text-sm font-medium">{classItem.course}</p>
//                           <p className="text-xs text-gray-600">{classItem.faculty}</p>
//                         </div>
//                         <div className="text-right">
//                           <p className="text-sm">{classItem.slot}</p>
//                           <p className="text-xs text-gray-600">{classItem.room}</p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// // Profile Summary Component
// function ProfileSummary({ student }) {
//   return (
//     <Card className="shadow-lg">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <User className="w-5 h-5 text-indigo-600" />
//           Profile Summary
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="text-center mb-4">
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
//             <User className="w-8 h-8 text-blue-600" />
//           </div>
//           <h3 className="font-semibold text-lg">{student.name}</h3>
//           <p className="text-sm text-gray-600">{student.rollNumber}</p>
//         </div>
        
//         <div className="space-y-3 text-sm">
//           <div className="flex items-center gap-2">
//             <Mail className="w-4 h-4 text-gray-500" />
//             <span className="text-gray-700 truncate">{student.email}</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <Phone className="w-4 h-4 text-gray-500" />
//             <span className="text-gray-700">{student.phone}</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <GraduationCap className="w-4 h-4 text-gray-500" />
//             <span className="text-gray-700">{student.year}</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <MapPin className="w-4 h-4 text-gray-500" />
//             <span className="text-gray-700 text-xs">{student.department}</span>
//           </div>
//         </div>
        
//         <Button variant="outline" className="w-full mt-4">
//           <Settings className="w-4 h-4 mr-2" />
//           Edit Profile
//         </Button>
//       </CardContent>
//     </Card>
//   );
// }

// // Announcements Component
// function AnnouncementsCard({ announcements }) {
//   return (
//     <Card className="shadow-lg">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Bell className="w-5 h-5 text-yellow-600" />
//           Announcements
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         {announcements.length === 0 ? (
//           <div className="text-center py-4">
//             <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
//             <p className="text-gray-500 text-sm">No announcements</p>
//           </div>
//         ) : (
//           <div className="space-y-3 max-h-64 overflow-y-auto">
//             {announcements.slice(0, 5).map((announcement, index) => (
//               <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//                 <h4 className="font-medium text-sm text-gray-900 mb-1">
//                   {announcement.title || 'System Announcement'}
//                 </h4>
//                 <p className="text-xs text-gray-600 mb-2">
//                   {announcement.message || announcement.content || 'No details available'}
//                 </p>
//                 <div className="flex justify-between items-center text-xs text-gray-500">
//                   <span>{announcement.type || 'General'}</span>
//                   <span>{announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : 'Recent'}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// // Main App Component
// export default function App() {
//   const [currentView, setCurrentView] = useState('login');
//   const [userRole, setUserRole] = useState(null);

//   useEffect(() => {
//     // Check if user is already logged in
//     const role = apiService.getUserRole();
//     const token = localStorage.getItem('token');
    
//     if (token && role) {
//       setUserRole(role);
//       setCurrentView(getDashboardView(role));
//     }
//   }, []);

//   const getDashboardView = (role) => {
//     switch(role) {
//       case 'student':
//         return 'student-dashboard';
//       case 'teacher':
//         return 'teacher-dashboard';
//       case 'admin':
//         return 'admin-dashboard';
//       default:
//         return 'login';
//     }
//   };

//   const handleLogin = (role) => {
//     setUserRole(role);
//     setCurrentView(getDashboardView(role));
//   };

//   const handleLogout = () => {
//     apiService.logout();
//     setUserRole(null);
//     setCurrentView('login');
//   };

//   // Route to appropriate dashboard based on user role
//   switch(currentView) {
//     case 'login':
//       return <LoginComponent onLogin={handleLogin} />;
    
//     case 'student-dashboard':
//       return <StudentDashboard onLogout={handleLogout} />;
    
//     case 'teacher-dashboard':
//       return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
//           <Card className="shadow-xl max-w-md">
//             <CardContent className="p-8 text-center">
//               <User className="w-16 h-16 mx-auto mb-4 text-green-600" />
//               <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
//               <p className="text-gray-600 mb-4">Teacher dashboard coming soon...</p>
//               <Button onClick={handleLogout}>Logout</Button>
//             </CardContent>
//           </Card>
//         </div>
//       );
    
//     case 'admin-dashboard':
//       return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-violet-50">
//           <Card className="shadow-xl max-w-md">
//             <CardContent className="p-8 text-center">
//               <User className="w-16 h-16 mx-auto mb-4 text-purple-600" />
//               <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
//               <p className="text-gray-600 mb-4">Admin dashboard coming soon...</p>
//               <Button onClick={handleLogout}>Logout</Button>
//             </CardContent>
//           </Card>
//         </div>
//       );
    
//     default:
//       return <LoginComponent onLogin={handleLogin} />;
//   }
// }