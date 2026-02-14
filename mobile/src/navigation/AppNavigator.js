// Navigation structure with React Navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'; // Changed to JS Stack
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentTimetable from '../screens/student/StudentTimetable';
import StudentAttendance from '../screens/student/StudentAttendance';
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import TeacherTimetable from '../screens/teacher/TeacherTimetable';
import RoomStatus from '../screens/teacher/RoomStatus';
import SwapRequests from '../screens/teacher/SwapRequests';
import MarkAttendance from '../screens/teacher/MarkAttendance';
import LeaveRequests from '../screens/common/LeaveRequests';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageSwapRequests from '../screens/admin/ManageSwapRequests';
import ManageLeaveRequests from '../screens/admin/ManageLeaveRequests';
import ViewTimetable from '../screens/admin/ViewTimetable';
import ManageUsers from '../screens/admin/ManageUsers';
import ProfileScreen from '../screens/common/ProfileScreen';
import ChatScreen from '../screens/common/ChatScreen';
import AnnouncementsScreen from '../screens/common/AnnouncementsScreen';
import LoadingScreen from '../components/common/Loading';

const Stack = createStackNavigator(); // JS Stack

const AppNavigator = () => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#3498db',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    presentation: 'card', // Standard card transition
                    animationEnabled: true,
                }}
                detachInactiveScreens={false} // CRITICAL FIX: Prevents native crashes
            >
                {!isAuthenticated ? (
                    // Auth Stack
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                ) : (
                    // Main App Stack based on user role
                    <>
                        {user?.role === 'student' && (
                            <>
                                <Stack.Screen
                                    name="StudentDashboard"
                                    component={StudentDashboard}
                                    options={{ title: 'Student Dashboard', headerShown: false }}
                                />
                                <Stack.Screen
                                    name="StudentTimetable"
                                    component={StudentTimetable}
                                    options={{ title: 'My Timetable' }}
                                />
                                <Stack.Screen
                                    name="StudentAttendance"
                                    component={StudentAttendance}
                                    options={{ title: 'My Attendance' }}
                                />
                                <Stack.Screen
                                    name="Profile"
                                    component={ProfileScreen}
                                    options={{ title: 'My Profile' }}
                                />
                                <Stack.Screen
                                    name="Chat"
                                    component={ChatScreen}
                                    options={{ title: 'AI Assistant' }}
                                />
                                <Stack.Screen
                                    name="Announcements"
                                    component={AnnouncementsScreen}
                                    options={{ title: 'Announcements' }}
                                />
                            </>
                        )}
                        {user?.role === 'teacher' && (
                            <>
                                <Stack.Screen
                                    name="TeacherDashboard"
                                    component={TeacherDashboard}
                                    options={{ title: 'Teacher Dashboard', headerShown: false }}
                                />
                                <Stack.Screen
                                    name="TeacherTimetable"
                                    component={TeacherTimetable}
                                    options={{ title: 'My Timetable' }}
                                />
                                <Stack.Screen
                                    name="RoomStatus"
                                    component={RoomStatus}
                                    options={{ title: 'Room Status' }}
                                />
                                <Stack.Screen
                                    name="SwapRequests"
                                    component={SwapRequests}
                                    options={{ title: 'Swap Requests' }}
                                />
                                <Stack.Screen
                                    name="LeaveRequests"
                                    component={LeaveRequests}
                                    options={{ title: 'Leave Requests' }}
                                />
                                <Stack.Screen
                                    name="Profile"
                                    component={ProfileScreen}
                                    options={{ title: 'My Profile' }}
                                />
                                <Stack.Screen
                                    name="MarkAttendance"
                                    component={MarkAttendance}
                                    options={{ title: 'Mark Attendance' }}
                                />
                                <Stack.Screen
                                    name="Chat"
                                    component={ChatScreen}
                                    options={{ title: 'AI Assistant' }}
                                />
                                <Stack.Screen
                                    name="Announcements"
                                    component={AnnouncementsScreen}
                                    options={{ title: 'Announcements' }}
                                />
                            </>
                        )}
                        {user?.role === 'admin' && (
                            <>
                                <Stack.Screen
                                    name="AdminDashboard"
                                    component={AdminDashboard}
                                    options={{ title: 'Admin Dashboard', headerShown: false }}
                                />
                                <Stack.Screen
                                    name="ManageSwapRequests"
                                    component={ManageSwapRequests}
                                    options={{ title: 'Swap Requests' }}
                                />
                                <Stack.Screen
                                    name="ManageLeaveRequests"
                                    component={ManageLeaveRequests}
                                    options={{ title: 'Leave Requests' }}
                                />
                                <Stack.Screen
                                    name="ViewTimetable"
                                    component={ViewTimetable}
                                    options={{ title: 'All Timetables' }}
                                />
                                <Stack.Screen
                                    name="Profile"
                                    component={ProfileScreen}
                                    options={{ title: 'My Profile' }}
                                />
                                <Stack.Screen
                                    name="ManageUsers"
                                    component={ManageUsers}
                                    options={{ title: 'Manage Users' }}
                                />
                                <Stack.Screen
                                    name="Chat"
                                    component={ChatScreen}
                                    options={{ title: 'AI Assistant' }}
                                />
                                <Stack.Screen
                                    name="Announcements"
                                    component={AnnouncementsScreen}
                                    options={{ title: 'Announcements' }}
                                />
                            </>
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
