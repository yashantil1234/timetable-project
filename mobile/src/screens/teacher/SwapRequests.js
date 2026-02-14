import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    ScrollView,
    Modal
} from 'react-native';
import apiService from '../../services/api';

const SwapRequests = () => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form State
    const [myClasses, setMyClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [proposedDay, setProposedDay] = useState('Monday');
    const [proposedTime, setProposedTime] = useState('');
    const [reason, setReason] = useState('');
    const [showClassModal, setShowClassModal] = useState(false);

    // History State
    const [history, setHistory] = useState([]);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        if (activeTab === 'new') {
            fetchMyClasses();
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchMyClasses = async () => {
        setLoading(true);
        try {
            const data = await apiService.getTeacherTimetable();
            if (data && data.timetable) {
                setMyClasses(data.timetable);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load your classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await apiService.getTeacherSwapRequests();
            setHistory(data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to load swap history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedClass || !proposedTime || !reason) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Basic Time Validation (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(proposedTime)) {
            Alert.alert('Error', 'Time must be in HH:MM format (e.g., 10:30)');
            return;
        }

        setLoading(true);
        try {
            await apiService.createSwapRequest({
                original_timetable_id: selectedClass.id,
                proposed_day: proposedDay,
                proposed_start_time: proposedTime,
                reason: reason
            });
            Alert.alert('Success', 'Swap request submitted successfully');
            // Reset form
            setSelectedClass(null);
            setProposedTime('');
            setReason('');
            setProposedDay('Monday');
            // Switch to history
            setActiveTab('history');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#2ecc71';
            case 'rejected': return '#e74c3c';
            default: return '#f1c40f';
        }
    };

    const renderHistoryItem = ({ item }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
                <Text style={styles.historyCourse}>{item.course_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.swapDetails}>
                <View style={styles.swapColumn}>
                    <Text style={styles.labelSmall}>FROM</Text>
                    <Text style={styles.swapText}>{item.original_day}</Text>
                    <Text style={styles.swapText}>{item.original_start_time}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
                <View style={styles.swapColumn}>
                    <Text style={styles.labelSmall}>TO</Text>
                    <Text style={styles.swapText}>{item.proposed_day}</Text>
                    <Text style={styles.swapText}>{item.proposed_start_time}</Text>
                </View>
            </View>

            <Text style={styles.reasonText}>Reason: {item.reason}</Text>
            {item.admin_notes && (
                <Text style={styles.adminNotes}>Admin Note: {item.admin_notes}</Text>
            )}
        </View>
    );

    const renderClassItem = ({ item }) => (
        <TouchableOpacity
            style={styles.classItem}
            onPress={() => {
                setSelectedClass(item);
                setShowClassModal(false);
            }}
        >
            <Text style={styles.classItemText}>{item.course} ({item.section})</Text>
            <Text style={styles.classItemSub}>{item.day} at {item.start_time}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'new' && styles.activeTab]}
                    onPress={() => setActiveTab('new')}
                >
                    <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>New Request</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>My History</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'new' ? (
                <ScrollView contentContainerStyle={styles.formContainer}>
                    <Text style={styles.sectionTitle}>1. Select Class to Swap</Text>
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => setShowClassModal(true)}
                    >
                        <Text style={styles.selectButtonText}>
                            {selectedClass ? `${selectedClass.course} (${selectedClass.day} ${selectedClass.start_time})` : 'Select a Class...'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>2. Propose New Time</Text>

                    <Text style={styles.label}>Proposed Day</Text>
                    <View style={styles.dayContainer}>
                        {DAYS.map(day => (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayButton, proposedDay === day && styles.activeDayButton]}
                                onPress={() => setProposedDay(day)}
                            >
                                <Text style={[styles.dayText, proposedDay === day && styles.activeDayText]}>
                                    {day.substring(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Proposed Time (HH:MM)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 14:30"
                        value={proposedTime}
                        onChangeText={setProposedTime}
                        keyboardType="numbers-and-punctuation"
                    />

                    <Text style={styles.label}>Reason</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Why do you need to swap?"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, !selectedClass && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading || !selectedClass}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Swap Request</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View style={styles.listContainer}>
                    {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#3498db" />}
                    <FlatList
                        data={history}
                        renderItem={renderHistoryItem}
                        keyExtractor={item => item.id.toString()}
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchHistory(); }}
                        ListEmptyComponent={
                            !loading && <Text style={styles.emptyText}>No swap requests found.</Text>
                        }
                    />
                </View>
            )}

            {/* Class Selection Modal */}
            <Modal visible={showClassModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select a Class</Text>
                    <FlatList
                        data={myClasses}
                        renderItem={renderClassItem}
                        keyExtractor={item => item.id.toString()}
                    />
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowClassModal(false)}
                    >
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 5,
        elevation: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#3498db',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7f8c8d',
    },
    activeTabText: {
        color: '#3498db',
    },
    formContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
        marginTop: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 8,
        marginTop: 10,
    },
    selectButton: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3498db',
        alignItems: 'center',
    },
    selectButtonText: {
        color: '#3498db',
        fontSize: 16,
        fontWeight: '500',
    },
    dayContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    dayButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#ecf0f1',
        marginRight: 8,
        marginBottom: 8,
    },
    activeDayButton: {
        backgroundColor: '#3498db',
    },
    dayText: {
        color: '#7f8c8d',
    },
    activeDayText: {
        color: '#fff',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#9b59b6', // Purple for teacher actions
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: '#bdc3c7',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    classItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#3498db',
    },
    classItemText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    classItemSub: {
        color: '#7f8c8d',
        marginTop: 4,
    },
    closeButton: {
        backgroundColor: '#e74c3c',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
        padding: 15,
    },
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    historyCourse: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#2c3e50',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    swapDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    swapColumn: {
        flex: 1,
        alignItems: 'center',
    },
    arrow: {
        fontSize: 20,
        color: '#7f8c8d',
        marginHorizontal: 10,
    },
    labelSmall: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#95a5a6',
        marginBottom: 2,
    },
    swapText: {
        fontSize: 14,
        color: '#2c3e50',
        fontWeight: '500',
    },
    reasonText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 5,
    },
    adminNotes: {
        fontSize: 13,
        color: '#e67e22',
        marginTop: 5,
        backgroundColor: '#fff5e6',
        padding: 5,
        borderRadius: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#95a5a6',
        fontSize: 16,
    },
});

export default SwapRequests;
