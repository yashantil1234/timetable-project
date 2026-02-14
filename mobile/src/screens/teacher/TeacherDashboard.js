// Teacher Dashboard Screen
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

const TeacherDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [todaysClasses, setTodaysClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getTeacherTimetable();
            if (data && data.timetable) {
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const classes = data.timetable.filter(item => item.day === today);
                classes.sort((a, b) => a.start_time.localeCompare(b.start_time));
                setTodaysClasses(classes);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.name}>{user?.full_name || 'Teacher'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileButtonText}>Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.actionsGrid}>
                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#3498db' }]}
                    onPress={() => navigation.navigate('TeacherTimetable')}
                >
                    <Text style={styles.actionIcon}>📅</Text>
                    <Text style={styles.actionTitle}>My Timetable</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#2ecc71' }]}
                    onPress={() => navigation.navigate('RoomStatus')}
                >
                    <Text style={styles.actionIcon}>🏫</Text>
                    <Text style={styles.actionTitle}>Room Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#f39c12' }]}
                    onPress={() => navigation.navigate('SwapRequests')}
                >
                    <Text style={styles.actionIcon}>🔄</Text>
                    <Text style={styles.actionTitle}>Swap Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#9b59b6' }]}
                    onPress={() => navigation.navigate('LeaveRequests')}
                >
                    <Text style={styles.actionIcon}>📝</Text>
                    <Text style={styles.actionTitle}>Leave Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#e74c3c' }]}
                    onPress={() => navigation.navigate('MarkAttendance')}
                >
                    <Text style={styles.actionIcon}>✓</Text>
                    <Text style={styles.actionTitle}>Mark Attendance</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#16a085' }]}
                    onPress={() => navigation.navigate('Chat')}
                >
                    <Text style={styles.actionIcon}>🤖</Text>
                    <Text style={styles.actionTitle}>AI Assistant</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#e67e22' }]}
                    onPress={() => navigation.navigate('Announcements')}
                >
                    <Text style={styles.actionIcon}>📢</Text>
                    <Text style={styles.actionTitle}>Announcements</Text>
                </TouchableOpacity>
            </View>

            {/* Today's Schedule */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Classes</Text>
                {todaysClasses.length > 0 ? (
                    todaysClasses.map((item, index) => (
                        <View key={index} style={styles.classCard}>
                            <View style={styles.timeBox}>
                                <Text style={styles.timeText}>{item.start_time}</Text>
                            </View>
                            <View style={styles.classInfo}>
                                <Text style={styles.className}>{item.course}</Text>
                                <Text style={styles.classDetail}>
                                    📍 {item.room}   👥 {item.section || 'Unknown Section'}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No classes scheduled for today.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#3498db',
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.9,
    },
    name: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
    },
    profileButton: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    profileButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
    },
    actionCard: {
        width: '48%',
        aspectRatio: 1,
        margin: '1%',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    actionTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
    },
    classCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },
    timeBox: {
        backgroundColor: '#e8f6f3',
        padding: 10,
        borderRadius: 8,
        marginRight: 12,
    },
    timeText: {
        color: '#16a085',
        fontWeight: 'bold',
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 4,
    },
    classDetail: {
        color: '#7f8c8d',
        fontSize: 14,
    },
    emptyCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        color: '#95a5a6',
        fontStyle: 'italic',
    },
});

export default TeacherDashboard;
