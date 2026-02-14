import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import apiService from '../../services/api';

const ManageLeaveRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await apiService.getAllLeaveRequests(filter);
            setRequests(data);
        } catch (error) {
            console.error('Error loading leave requests:', error);
            Alert.alert('Error', 'Failed to load leave requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await apiService.adminApproveLeave(id);
            Alert.alert('Success', 'Leave request approved');
            loadRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to approve request');
        }
    };

    const handleReject = async (id) => {
        Alert.prompt(
            'Reject Request',
            'Enter reason for rejection:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async (notes) => {
                        try {
                            await apiService.adminRejectLeave(id, notes);
                            Alert.alert('Success', 'Leave request rejected');
                            loadRequests();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject request');
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadRequests();
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.userName}>{item.full_name}</Text>
                    <Text style={styles.userDept}>{item.department || 'N/A'}</Text>
                </View>
                <View style={[styles.badge, styles[`badge_${item.status}`]]}>
                    <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.row}>
                    <Text style={styles.label}>Type:</Text>
                    <Text style={styles.value}>{item.leave_type}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Dates:</Text>
                    <Text style={styles.value}>{item.start_date} to {item.end_date}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Days:</Text>
                    <Text style={styles.value}>{item.days_requested}</Text>
                </View>
            </View>

            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>

            {item.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => handleReject(item.id)}
                    >
                        <Text style={styles.buttonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.approveButton]}
                        onPress={() => handleApprove(item.id)}
                    >
                        <Text style={styles.buttonText}>Approve</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                {['pending', 'approved', 'rejected'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[styles.filterTab, filter === status && styles.activeFilter]}
                        onPress={() => setFilter(status)}
                    >
                        <Text style={[styles.filterText, filter === status && styles.activeFilterText]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No {filter} requests found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        elevation: 2,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeFilter: {
        borderBottomColor: '#3498db',
    },
    filterText: {
        color: '#7f8c8d',
        fontWeight: '600',
    },
    activeFilterText: {
        color: '#3498db',
    },
    loader: {
        marginTop: 50,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    userDept: {
        fontSize: 12,
        color: '#95a5a6',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badge_pending: { backgroundColor: '#f1c40f' },
    badge_approved: { backgroundColor: '#2ecc71' },
    badge_rejected: { backgroundColor: '#e74c3c' },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    detailsContainer: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: 60,
        fontSize: 12,
        color: '#95a5a6',
        fontWeight: 'bold',
    },
    value: {
        flex: 1,
        fontSize: 14,
        color: '#34495e',
    },
    reasonLabel: {
        fontSize: 12,
        color: '#95a5a6',
        marginBottom: 2,
    },
    reasonText: {
        fontSize: 14,
        color: '#2c3e50',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#e74c3c',
    },
    approveButton: {
        backgroundColor: '#2ecc71',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#95a5a6',
        fontSize: 16,
    },
});

export default ManageLeaveRequests;
