import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import apiService from '../../services/api';

const AnnouncementsScreen = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            const data = await apiService.getAnnouncements();
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error loading announcements:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadAnnouncements();
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#e74c3c';
            case 'medium': return '#f39c12';
            default: return '#3498db';
        }
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high': return '🔴 High Priority';
            case 'medium': return '🟡 Medium Priority';
            default: return '🔵 Normal';
        }
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
            {announcements.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📢</Text>
                    <Text style={styles.emptyText}>No announcements yet</Text>
                    <Text style={styles.emptySubtext}>Check back later for updates</Text>
                </View>
            ) : (
                announcements.map((announcement) => (
                    <View
                        key={announcement.id}
                        style={[
                            styles.announcementCard,
                            { borderLeftColor: getPriorityColor(announcement.priority) }
                        ]}
                    >
                        <View style={styles.headerRow}>
                            <Text style={styles.priorityBadge}>
                                {getPriorityLabel(announcement.priority)}
                            </Text>
                            <Text style={styles.date}>
                                {new Date(announcement.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={styles.title}>{announcement.title}</Text>
                        <Text style={styles.message}>{announcement.message}</Text>
                        {announcement.expires_at && (
                            <Text style={styles.expires}>
                                Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                ))
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    announcementCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    priorityBadge: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },
    date: {
        fontSize: 12,
        color: '#95a5a6',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 8,
    },
    expires: {
        fontSize: 12,
        color: '#95a5a6',
        fontStyle: 'italic',
        marginTop: 4,
    },
});

export default AnnouncementsScreen;
