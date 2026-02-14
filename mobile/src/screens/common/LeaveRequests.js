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
    ScrollView
} from 'react-native';
import apiService from '../../services/api';

const LeaveRequests = () => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form State
    const [leaveType, setLeaveType] = useState('sick');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    // History State
    const [history, setHistory] = useState([]);

    const LEAVE_TYPES = ['sick', 'vacation', 'personal', 'emergency', 'medical', 'family', 'casual'];

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await apiService.getLeaveRequests(); // Uses getMyLeaveRequests internally
            setHistory(data || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to load leave history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Basic Date Regex Validation (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            Alert.alert('Error', 'Dates must be in YYYY-MM-DD format');
            return;
        }

        setLoading(true);
        try {
            await apiService.submitLeaveRequest({
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason
            });
            Alert.alert('Success', 'Leave request submitted successfully');
            // Reset form
            setStartDate('');
            setEndDate('');
            setReason('');
            setLeaveType('sick');
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
                <Text style={styles.historyType}>{item.leave_type.toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>
            <Text style={styles.dateRange}>{item.start_date} to {item.end_date}</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
            {item.admin_notes && (
                <Text style={styles.adminNotes}>Admin Note: {item.admin_notes}</Text>
            )}
            <Text style={styles.dateText}>Requested on: {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
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
                    <Text style={styles.label}>Leave Type</Text>
                    <View style={styles.typeContainer}>
                        {LEAVE_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.typeButton, leaveType === type && styles.activeTypeButton]}
                                onPress={() => setLeaveType(type)}
                            >
                                <Text style={[styles.typeText, leaveType === type && styles.activeTypeText]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2024-03-20"
                        value={startDate}
                        onChangeText={setStartDate}
                    />

                    <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2024-03-22"
                        value={endDate}
                        onChangeText={setEndDate}
                    />

                    <Text style={styles.label}>Reason</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Reason for leave..."
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={4}
                    />

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Request</Text>
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
                            !loading && <Text style={styles.emptyText}>No leave requests found.</Text>
                        }
                    />
                </View>
            )}
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
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 8,
        marginTop: 10,
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
        height: 100,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    typeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3498db',
        marginRight: 8,
        marginBottom: 8,
    },
    activeTypeButton: {
        backgroundColor: '#3498db',
    },
    typeText: {
        color: '#3498db',
        fontSize: 14,
    },
    activeTypeText: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#2ecc71',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
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
        marginBottom: 10,
    },
    historyType: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#2c3e50',
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
    dateRange: {
        fontSize: 15,
        color: '#34495e',
        marginBottom: 5,
    },
    reasonText: {
        fontSize: 14,
        color: '#7f8c8d',
        fontStyle: 'italic',
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
    dateText: {
        fontSize: 12,
        color: '#95a5a6',
        marginTop: 8,
        textAlign: 'right',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#95a5a6',
        fontSize: 16,
    },
});

export default LeaveRequests;
