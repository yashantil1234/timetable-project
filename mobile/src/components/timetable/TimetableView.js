// Reusable Timetable View Component
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView
} from 'react-native';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableView = ({ data, role }) => {
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    const [daySchedule, setDaySchedule] = useState([]);

    // Ensure selected day is valid (e.g. if today is Sunday, default to Monday)
    useEffect(() => {
        if (!DAYS.includes(selectedDay)) {
            setSelectedDay('Monday');
        }
    }, []);

    useEffect(() => {
        if (data) {
            const filtered = data.filter(item => item.day === selectedDay);
            // Sort by start time
            filtered.sort((a, b) => {
                return a.start_time.localeCompare(b.start_time);
            });
            setDaySchedule(filtered);
        }
    }, [data, selectedDay]);

    const renderTimeSlot = ({ item }) => {
        const isLecture = item.type === 'Lecture' || !item.type;
        const cardColor = isLecture ? '#3498db' : '#e67e22'; // Blue for lecture, Orange for lab/other

        return (
            <View style={[styles.card, { borderLeftColor: cardColor }]}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{item.start_time}</Text>
                    <Text style={styles.durationText}>1 Hour</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.subjectText}>{item.course}</Text>

                    <View style={styles.row}>
                        <Text style={styles.icon}>📍</Text>
                        <Text style={styles.detailText}>{item.room}</Text>
                    </View>

                    {role === 'student' && (
                        <View style={styles.row}>
                            <Text style={styles.icon}>👨‍🏫</Text>
                            <Text style={styles.detailText}>{item.faculty || 'No Faculty'}</Text>
                        </View>
                    )}

                    {role === 'teacher' && (
                        <View style={styles.row}>
                            <Text style={styles.icon}>👥</Text>
                            <Text style={styles.detailText}>{item.section}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Day Selector */}
            <View style={styles.daySelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {DAYS.map((day) => (
                        <TouchableOpacity
                            key={day}
                            style={[
                                styles.dayButton,
                                selectedDay === day && styles.dayButtonActive
                            ]}
                            onPress={() => setSelectedDay(day)}
                        >
                            <Text style={[
                                styles.dayText,
                                selectedDay === day && styles.dayTextActive
                            ]}>
                                {day.substring(0, 3)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Schedule List */}
            <View style={styles.scheduleContainer}>
                <Text style={styles.headerTitle}>{selectedDay}'s Schedule</Text>

                {daySchedule.length > 0 ? (
                    <FlatList
                        data={daySchedule}
                        renderItem={renderTimeSlot}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No classes scheduled for {selectedDay}</Text>
                        <Text style={styles.emptySubText}>Enjoy your free time! 🎉</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    daySelectorContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    dayButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
        backgroundColor: '#f0f2f5',
    },
    dayButtonActive: {
        backgroundColor: '#3498db',
    },
    dayText: {
        fontWeight: '600',
        color: '#7f8c8d',
    },
    dayTextActive: {
        color: '#fff',
    },
    scheduleContainer: {
        flex: 1,
        padding: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    timeContainer: {
        width: 70,
        borderRightWidth: 1,
        borderRightColor: '#f0f0f0',
        justifyContent: 'center',
        paddingRight: 10,
    },
    timeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    durationText: {
        fontSize: 12,
        color: '#95a5a6',
        marginTop: 4,
    },
    detailsContainer: {
        flex: 1,
        paddingLeft: 16,
        justifyContent: 'center',
    },
    subjectText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    icon: {
        fontSize: 12,
        marginRight: 6,
        width: 16,
    },
    detailText: {
        fontSize: 14,
        color: '#7f8c8d',
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#95a5a6',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#bdc3c7',
    },
});

export default TimetableView;
