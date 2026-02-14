import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Dimensions
} from 'react-native';
import apiService from '../../services/api';

const StudentAttendance = () => {
    const [attendance, setAttendance] = useState(0);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const data = await apiService.getDetailedAttendance();
            setAttendance(data.overall_attendance || 0);
            setSubjects(data.subjects || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusColor = (percent) => {
        if (percent >= 75) return '#2ecc71'; // Green
        if (percent >= 60) return '#f1c40f'; // Yellow
        return '#e74c3c'; // Red
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    const color = getStatusColor(attendance);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.card}>
                <Text style={styles.title}>Overall Attendance</Text>

                <View style={[styles.circle, { borderColor: color }]}>
                    <Text style={[styles.percentText, { color: color }]}>
                        {attendance}%
                    </Text>
                </View>

                <Text style={styles.statusText}>
                    {attendance >= 75
                        ? "You have good attendance! Keep it up. 🌟"
                        : "Your attendance is low. Please attend more classes. ⚠️"}
                </Text>
            </View>

            {subjects.length > 0 && (
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Subject-wise Attendance</Text>
                    {subjects.map((subject, index) => (
                        <View key={index} style={styles.subjectRow}>
                            <View style={styles.subjectInfo}>
                                <Text style={styles.subjectName}>{subject.course_name}</Text>
                                <Text style={styles.subjectStats}>
                                    {subject.present + subject.late}/{subject.total_classes} classes
                                </Text>
                            </View>
                            <View style={[
                                styles.percentageBadge,
                                { backgroundColor: getStatusColor(subject.percentage) }
                            ]}>
                                <Text style={styles.percentageText}>{subject.percentage}%</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {subjects.length === 0 && (
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>No Attendance Records</Text>
                    <Text style={styles.infoText}>
                        Attendance has not been marked yet. Check back after your teachers mark attendance.
                    </Text>
                </View>
            )}

            <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Attendance Criteria</Text>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2ecc71' }]} />
                    <Text style={styles.legendText}>75% and above (Safe)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#f1c40f' }]} />
                    <Text style={styles.legendText}>60% - 74% (Warning)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
                    <Text style={styles.legendText}>Below 60% (Critical)</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 4,
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
    },
    circle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    percentText: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    statusText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#7f8c8d',
        marginHorizontal: 10,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 10,
    },
    infoText: {
        color: '#7f8c8d',
        lineHeight: 22,
    },
    legendContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        marginBottom: 20,
    },
    legendTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    legendText: {
        color: '#555',
        fontSize: 14,
    },
    subjectRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    subjectStats: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    percentageBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    percentageText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default StudentAttendance;
