// Teacher Timetable Screen
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import apiService from '../../services/api';
import TimetableView from '../../components/timetable/TimetableView';

const TeacherTimetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const data = await apiService.getTeacherTimetable();
            // API returns { timetable: [...], teacher_name: ..., department: ... }
            if (data && data.timetable) {
                setTimetable(data.timetable);
            } else {
                setTimetable([]);
            }
        } catch (err) {
            console.error('Error fetching teacher timetable:', err);
            setError('Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.retryText} onPress={fetchTimetable}>Tap to retry</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TimetableView data={timetable} role="teacher" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        color: '#7f8c8d',
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 16,
        marginBottom: 10,
    },
    retryText: {
        color: '#3498db',
        fontWeight: 'bold',
    },
});

export default TeacherTimetable;
