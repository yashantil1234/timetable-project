import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    RefreshControl
} from 'react-native';
import apiService from '../../services/api';

const RoomStatus = () => {
    const [rooms, setRooms] = useState({ free_rooms: [], occupied_rooms: [], unmarked_rooms: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Marking State
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchRoomStatus();
    }, []);

    const fetchRoomStatus = async () => {
        try {
            const data = await apiService.getRoomStatus();
            setRooms(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load room status');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMarkRoom = async (status) => {
        if (!selectedRoom) return;

        try {
            await apiService.markRoom(selectedRoom.room_id, status, notes);
            Alert.alert('Success', `Room marked as ${status}`);
            setStatusModalVisible(false);
            setNotes('');
            setSelectedRoom(null);
            fetchRoomStatus(); // Refresh data
        } catch (error) {
            Alert.alert('Error', 'Failed to update room status');
        }
    };

    const openMarkModal = (room) => {
        setSelectedRoom(room);
        setNotes(room.notes || '');
        setStatusModalVisible(true);
    };

    const renderRoomItem = ({ item, status }) => {
        const getStatusColor = () => {
            switch (status) {
                case 'free': return '#2ecc71';
                case 'occupied': return '#e74c3c';
                default: return '#95a5a6';
            }
        };

        return (
            <TouchableOpacity
                style={[styles.roomCard, { borderLeftColor: getStatusColor() }]}
                onPress={() => openMarkModal(item)}
            >
                <View style={styles.roomHeader}>
                    <Text style={styles.roomName}>{item.room_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={styles.capacityText}>Capacity: {item.capacity}</Text>
                {item.updated_by && (
                    <Text style={styles.updatedText}>Updated by: {item.updated_by}</Text>
                )}
                {item.notes ? (
                    <Text style={styles.notesText}>Note: {item.notes}</Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRoomStatus(); }} />
                }
                data={[
                    { title: '🟢 Free Rooms', data: rooms.free_rooms, status: 'free' },
                    { title: '🔴 Occupied Rooms', data: rooms.occupied_rooms, status: 'occupied' },
                    { title: '⚪ Unmarked Rooms', data: rooms.unmarked_rooms, status: 'unmarked' }
                ]}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{item.title} ({item.data.length})</Text>
                        {item.data.length === 0 ? (
                            <Text style={styles.emptyText}>No rooms in this category</Text>
                        ) : (
                            item.data.map((room, index) => (
                                <View key={index}>
                                    {renderRoomItem({ item: room, status: item.status })}
                                </View>
                            ))
                        )}
                    </View>
                )}
            />

            {/* Mark Room Modal */}
            <Modal
                transparent={true}
                visible={statusModalVisible}
                animationType="slide"
                onRequestClose={() => setStatusModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Room Status</Text>
                        <Text style={styles.modalSubtitle}>{selectedRoom?.room_name}</Text>

                        <Text style={styles.label}>Add Note (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Class in session until 11 AM"
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.freeButton]}
                                onPress={() => handleMarkRoom('free')}
                            >
                                <Text style={styles.buttonText}>Mark Free</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.occupiedButton]}
                                onPress={() => handleMarkRoom('occupied')}
                            >
                                <Text style={styles.buttonText}>Mark Occupied</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setStatusModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
    },
    roomCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 10,
        elevation: 2,
        borderLeftWidth: 4,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    roomName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    capacityText: {
        color: '#7f8c8d',
        fontSize: 14,
    },
    updatedText: {
        color: '#95a5a6',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    notesText: {
        color: '#e67e22',
        fontSize: 14,
        marginTop: 8,
        fontWeight: '500',
    },
    emptyText: {
        color: '#bdc3c7',
        fontStyle: 'italic',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 20,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#34495e',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    freeButton: {
        backgroundColor: '#2ecc71',
    },
    occupiedButton: {
        backgroundColor: '#e74c3c',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        padding: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#7f8c8d',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default RoomStatus;
