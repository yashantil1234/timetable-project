// Admin Dashboard Screen
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

const AdminDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [refreshing, setRefreshing] = React.useState(false);
    const [stats, setStats] = React.useState({ total_users: 0, pending_requests: 0 });

    React.useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await apiService.getAdminStats();
            if (data) {
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
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
                    <Text style={styles.greeting}>Admin Dashboard</Text>
                    <Text style={styles.name}>{user?.full_name || 'Administrator'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.profileButtonText}>Profile</Text>
                </TouchableOpacity>
            </View>

            {/* System Overview */}
            <View style={styles.overviewSection}>
                <Text style={styles.sectionTitle}>System Overview</Text>
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
                        <Text style={styles.statNumber}>{stats.total_users}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#2ecc71' }]}>
                        <Text style={styles.statNumber}>{stats.pending_requests}</Text>
                        <Text style={styles.statLabel}>Pending Requests</Text>
                    </View>
                </View>
            </View>

            {/* Management Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Management</Text>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ManageSwapRequests')}
                >
                    <Text style={styles.actionIcon}>🔄</Text>
                    <Text style={styles.actionText}>Manage Swap Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ManageLeaveRequests')}
                >
                    <Text style={styles.actionIcon}>📝</Text>
                    <Text style={styles.actionText}>Manage Leave Requests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ViewTimetable')}
                >
                    <Text style={styles.actionIcon}>📅</Text>
                    <Text style={styles.actionText}>View Timetable</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ManageUsers')}
                >
                    <Text style={styles.actionIcon}>👥</Text>
                    <Text style={styles.actionText}>Manage Users</Text>
                </TouchableOpacity>
            </View>

            {/*  Note */}
            <View style={styles.noteCard}>
                <Text style={styles.noteText}>
                    💡 For advanced management features like CSV uploads, faculty management,
                    and timetable generation, please use the web dashboard.
                </Text>
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
        backgroundColor: '#e74c3c',
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
    overviewSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    section: {
        padding: 16,
    },
    actionButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        flex: 1,
    },
    noteCard: {
        backgroundColor: '#fff3cd',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#f39c12',
    },
    noteText: {
        fontSize: 14,
        color: '#856404',
        lineHeight: 20,
    },
});

export default AdminDashboard;
