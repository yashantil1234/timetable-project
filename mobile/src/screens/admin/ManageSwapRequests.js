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

const ManageSwapRequests = () => {
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
            const data = await apiService.getAllSwapRequests(filter);
            setRequests(data);
        } catch (error) {
            console.error('Error loading swap requests:', error);
            Alert.alert('Error', 'Failed to load swap requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await apiService.adminApproveSwap(id);
            Alert.alert('Success', 'Swap request approved');
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
                    onPress: async (reason) => {
                        try {
                            await apiService.adminRejectSwap(id, reason);
                            Alert.alert('Success', 'Swap request rejected');
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
                <Text style={styles.facultyName}>{item.requesting_faculty}</Text>
                <View style={[styles.badge, styles[`badge_${item.status}`]]}>
                    <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <Text style={styles.detailLabel}>Course:</Text>
                <Text style={styles.detailValue}>{item.course_name} ({item.section_name})</Text>
            </View>

            <View style={styles.swapContainer}>
                <View style={styles.swapBlock}>
                    <Text style={styles.swapLabel}>Original</Text>
                    <Text style={styles.swapValue}>{item.original_day}</Text>
                    <Text style={styles.swapValue}>{item.original_start_time}</Text>
                </View>
                <Text style={styles.arrow}>➡️</Text>
                <View style={styles.swapBlock}>
                    <Text style={styles.swapLabel}>Proposed</Text>
                    <Text style={styles.swapValue}>{item.proposed_day}</Text>
                    <Text style={styles.swapValue}>{item.proposed_start_time}</Text>
                </View>
            </View>

            <Text style={styles.reasonText}>Reason: {item.reason}</Text>

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
        alignItems: 'center',
        marginBottom: 12,
    },
    facultyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
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
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: '#95a5a6',
    },
    detailValue: {
        fontSize: 14,
        color: '#34495e',
        fontWeight: '500',
    },
    swapContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    swapBlock: {
        flex: 1,
    },
    swapLabel: {
        fontSize: 10,
        color: '#95a5a6',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    swapValue: {
        fontSize: 14,
        color: '#2c3e50',
        fontWeight: '600',
    },
    arrow: {
        fontSize: 20,
        marginHorizontal: 10,
    },
    reasonText: {
        fontSize: 14,
        color: '#7f8c8d',
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

export default ManageSwapRequests;
