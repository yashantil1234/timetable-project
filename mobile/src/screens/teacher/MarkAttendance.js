import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiService from '../../services/api';

const MarkAttendance = () => {
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedYear, setSelectedYear] = useState(1);
    const [selectedSection, setSelectedSection] = useState('');
    const [attendance, setAttendance] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    useEffect(() => {
        if (selectedDept && selectedYear) {
            loadSections();
        }
    }, [selectedDept, selectedYear]);

    const loadDepartments = async () => {
        try {
            const data = await apiService.getDepartments();
            setDepartments(data || []);
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const loadSections = async () => {
        try {
            const data = await apiService.getSections(selectedDept, selectedYear);
            setSections(data || []);
        } catch (error) {
            console.error('Error loading sections:', error);
        }
    };

    const loadStudents = async () => {
        if (!selectedDept || !selectedYear || !selectedSection) {
            Alert.alert('Error', 'Please select department, year, and section');
            return;
        }

        setIsLoading(true);
        try {
            const data = await apiService.getStudentsForSection(
                selectedDept,
                selectedYear,
                selectedSection
            );

            if (data && data.students) {
                setStudents(data.students);
                // Initialize all as present by default
                const initialAttendance = {};
                data.students.forEach(student => {
                    initialAttendance[student.id] = 'present';
                });
                setAttendance(initialAttendance);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to load students');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAttendance = (studentId) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
        }));
    };

    const markAllPresent = () => {
        const newAttendance = {};
        students.forEach(student => {
            newAttendance[student.id] = 'present';
        });
        setAttendance(newAttendance);
    };

    const markAllAbsent = () => {
        const newAttendance = {};
        students.forEach(student => {
            newAttendance[student.id] = 'absent';
        });
        setAttendance(newAttendance);
    };

    const submitAttendance = async () => {
        const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
            student_id: parseInt(studentId),
            status: status
        }));

        setIsSubmitting(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await apiService.markAttendance({
                attendance: attendanceRecords,
                date: today,
                course_id: null // Can be enhanced to select specific course
            });

            Alert.alert('Success', 'Attendance marked successfully!');
            setStudents([]);
            setAttendance({});
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to mark attendance');
        } finally {
            setIsSubmitting(false);
        }
    };

    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const absentCount = students.length - presentCount;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Select Class</Text>

                <Text style={styles.label}>Department</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedDept}
                        onValueChange={(value) => setSelectedDept(value)}
                    >
                        <Picker.Item label="Select Department" value="" />
                        {departments.map((dept) => (
                            <Picker.Item key={dept.id} label={dept.dept_name} value={dept.dept_name} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Year</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedYear}
                        onValueChange={(value) => setSelectedYear(value)}
                    >
                        <Picker.Item label="1st Year" value={1} />
                        <Picker.Item label="2nd Year" value={2} />
                        <Picker.Item label="3rd Year" value={3} />
                        <Picker.Item label="4th Year" value={4} />
                    </Picker>
                </View>

                <Text style={styles.label}>Section</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedSection}
                        onValueChange={(value) => setSelectedSection(value)}
                    >
                        <Picker.Item label="Select Section" value="" />
                        {sections.map((section) => (
                            <Picker.Item key={section.id} label={section.name} value={section.name} />
                        ))}
                    </Picker>
                </View>

                <TouchableOpacity style={styles.loadButton} onPress={loadStudents}>
                    <Text style={styles.loadButtonText}>Load Students</Text>
                </TouchableOpacity>
            </View>

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            )}

            {students.length > 0 && (
                <>
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{students.length}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#2ecc71' }]}>{presentCount}</Text>
                            <Text style={styles.statLabel}>Present</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{absentCount}</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                        </View>
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={[styles.actionButton, styles.presentButton]} onPress={markAllPresent}>
                            <Text style={styles.actionButtonText}>All Present</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.absentButton]} onPress={markAllAbsent}>
                            <Text style={styles.actionButtonText}>All Absent</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.studentsCard}>
                        <Text style={styles.cardTitle}>Students</Text>
                        {students.map((student) => (
                            <TouchableOpacity
                                key={student.id}
                                style={[
                                    styles.studentRow,
                                    attendance[student.id] === 'present' ? styles.presentRow : styles.absentRow
                                ]}
                                onPress={() => toggleAttendance(student.id)}
                            >
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.full_name}</Text>
                                    <Text style={styles.studentRoll}>{student.roll_number || 'N/A'}</Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    attendance[student.id] === 'present' ? styles.presentBadge : styles.absentBadge
                                ]}>
                                    <Text style={styles.statusText}>
                                        {attendance[student.id] === 'present' ? '✓ Present' : '✗ Absent'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={submitAttendance}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Attendance</Text>
                        )}
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginTop: 12,
        marginBottom: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
    },
    loadButton: {
        backgroundColor: '#3498db',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    loadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
        elevation: 2,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#3498db',
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    presentButton: {
        backgroundColor: '#2ecc71',
    },
    absentButton: {
        backgroundColor: '#e74c3c',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    studentsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    presentRow: {
        backgroundColor: '#e8f8f5',
        borderLeftWidth: 4,
        borderLeftColor: '#2ecc71',
    },
    absentRow: {
        backgroundColor: '#fadbd8',
        borderLeftWidth: 4,
        borderLeftColor: '#e74c3c',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
    },
    studentRoll: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    presentBadge: {
        backgroundColor: '#2ecc71',
    },
    absentBadge: {
        backgroundColor: '#e74c3c',
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#8e44ad',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 32,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MarkAttendance;
