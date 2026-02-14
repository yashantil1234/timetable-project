// Student Dashboard Screen
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

const StudentDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [todaysClasses, setTodaysClasses] = useState([]);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([loadProfile(), loadTodaysClasses()]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const loadProfile = async () => {
        const data = await apiService.getStudentProfile();
        setProfile(data);
    };

    const loadTodaysClasses = async () => {
        try {
            const data = await apiService.getStudentTimetable();
            if (data && data.timetable) {
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                const classes = data.timetable.filter(item => item.day === today);
                classes.sort((a, b) => a.start_time.localeCompare(b.start_time));
                setTodaysClasses(classes);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

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
                    <Text style={styles.name}>{user?.full_name || 'Student'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileButtonText}>Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            {profile && (
                <View style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileLabel}>Department:</Text>
                        <Text style={styles.profileValue}>{profile.dept_name}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileLabel}>Year:</Text>
                        <Text style={styles.profileValue}>{profile.year}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileLabel}>Section:</Text>
                        <Text style={styles.profileValue}>{profile.section}</Text>
                    </View>
                </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={[styles.actionCard, styles.actionCardPrimary]}
                    onPress={() => navigation.navigate('StudentTimetable')}
                >
                    <Text style={styles.actionIcon}>📅</Text>
                    <Text style={styles.actionTitle}>View Timetable</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#9b59b6' }]}
                    onPress={() => navigation.navigate('StudentAttendance')}
                >
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={styles.actionTitle}>My Attendance</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#3498db' }]}
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
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Today's Classes</Text>
                {todaysClasses.length > 0 ? (
                    todaysClasses.map((item, index) => (
                        <View key={index} style={styles.classCard}>
                            <View style={styles.timeBox}>
                                <Text style={styles.timeText}>{item.start_time}</Text>
                            </View>
                            <View style={styles.classInfo}>
                                <Text style={styles.className}>{item.course}</Text>
                                <Text style={styles.classDetail}>📍 {item.room}   👨‍🏫 {item.faculty || 'N/A'}</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    profileCard: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    profileLabel: {
        fontSize: 16,
        color: '#95a5a6',
    },
    profileValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    actionCard: {
        flex: 1,
        padding: 20,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionCardPrimary: {
        backgroundColor: '#3498db',
    },
    actionCardSecondary: {
        backgroundColor: '#2ecc71',
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    actionTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    infoSection: {
        paddingHorizontal: 16,
        marginBottom: 20,
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

export default StudentDashboard;
