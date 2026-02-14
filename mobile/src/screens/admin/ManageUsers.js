import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
    ScrollView
} from 'react-native';
import apiService from '../../services/api';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [departments, setDepartments] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'student', // student, teacher, admin
        full_name: '',
        email: '',
        phone: '',
        dept_name: '',
        year: '',
        section_name: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, deptsData] = await Promise.all([
                apiService.getUsers(),
                apiService.getDepartments()
            ]);
            setUsers(usersData);
            setDepartments(deptsData);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAddUser = async () => {
        if (!formData.username || !formData.password || !formData.full_name) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        try {
            await apiService.registerUser(formData);
            Alert.alert('Success', 'User registered successfully');
            setModalVisible(false);
            loadData();
            // Reset form
            setFormData({
                username: '',
                password: '',
                role: 'student',
                full_name: '',
                email: '',
                phone: '',
                dept_name: '',
                year: '',
                section_name: ''
            });
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to register user');
        }
    };

    const handleDelete = (user) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${user.full_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Note: Backend might need specific IDs (student_id vs faculty_id vs user_id)
                            // For simplicity assuming generic delete or role-based dispatch
                            // Current API supports deleteStudent and deleteFaculty
                            if (user.role === 'student') {
                                await apiService.deleteStudent(user.id); // This assumes user.id matches student table id, usually they are linked 1:1 or use user_id
                            } else if (user.role === 'teacher') {
                                // Faculty ID might differ from User ID. 
                                // Ideally backend /admin/users should return linked IDs.
                                // Quick fix: If API deleteUser is not available, this might be tricky without specific ID.
                                // Assuming we can't easily delete generic users without a generic endpoint.
                                Alert.alert('Notice', 'Delete is currently optimized for Students.');
                                return;
                            } else {
                                Alert.alert('Notice', 'Cannot delete Admins from mobile app.');
                                return;
                            }

                            Alert.alert('Success', 'User deleted');
                            loadData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.name}>{item.full_name}</Text>
                    <Text style={styles.username}>@{item.username}</Text>
                </View>
                <View style={[styles.badge, styles[`badge_${item.role}`]]}>
                    <Text style={styles.badgeText}>{item.role.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.details}>
                {item.department && <Text style={styles.detailText}>Dept: {item.department}</Text>}
                {item.email && <Text style={styles.detailText}>📧 {item.email}</Text>}
            </View>

            {item.role === 'student' && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item)}
                >
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ Add New User</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New User</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formScroll}>
                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleContainer}>
                                {['student', 'teacher', 'admin'].map((role) => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[styles.roleTab, formData.role === role && styles.activeRoleTab]}
                                        onPress={() => setFormData({ ...formData, role })}
                                    >
                                        <Text style={[styles.roleText, formData.role === role && styles.activeRoleText]}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Username *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.username}
                                onChangeText={(text) => setFormData({ ...formData, username: text })}
                                placeholder="Enter username"
                            />

                            <Text style={styles.label}>Password *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.password}
                                onChangeText={(text) => setFormData({ ...formData, password: text })}
                                placeholder="Enter password"
                                secureTextEntry
                            />

                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.full_name}
                                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                                placeholder="Enter full name"
                            />

                            <Text style={styles.label}>Department</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                                {departments.map((dept) => (
                                    <TouchableOpacity
                                        key={dept.id}
                                        style={[styles.chip, formData.dept_name === dept.dept_name && styles.activeChip]}
                                        onPress={() => setFormData({ ...formData, dept_name: dept.dept_name })}
                                    >
                                        <Text style={[styles.chipText, formData.dept_name === dept.dept_name && styles.activeChipText]}>
                                            {dept.dept_name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {formData.role === 'student' && (
                                <>
                                    <Text style={styles.label}>Year</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.year}
                                        onChangeText={(text) => setFormData({ ...formData, year: text })}
                                        placeholder="1-4"
                                        keyboardType="numeric"
                                    />

                                    <Text style={styles.label}>Section</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.section_name}
                                        onChangeText={(text) => setFormData({ ...formData, section_name: text })}
                                        placeholder="e.g. A"
                                    />
                                </>
                            )}

                            <TouchableOpacity style={styles.submitButton} onPress={handleAddUser}>
                                <Text style={styles.submitButtonText}>Register User</Text>
                            </TouchableOpacity>
                            <View style={{ height: 20 }} />
                        </ScrollView>
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
    listContent: {
        padding: 16,
    },
    loader: {
        marginTop: 50,
    },
    addButton: {
        backgroundColor: '#3498db',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    username: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badge_student: { backgroundColor: '#3498db' },
    badge_teacher: { backgroundColor: '#e67e22' },
    badge_admin: { backgroundColor: '#c0392b' },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    details: {
        marginTop: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 2,
    },
    deleteButton: {
        marginTop: 12,
        alignSelf: 'flex-end',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#fee',
        borderRadius: 6,
    },
    deleteText: {
        color: '#e74c3c',
        fontSize: 12,
        fontWeight: '600',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    closeText: {
        fontSize: 24,
        color: '#95a5a6',
    },
    formScroll: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: '#34495e',
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    roleTab: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3498db',
        alignItems: 'center',
    },
    activeRoleTab: {
        backgroundColor: '#3498db',
    },
    roleText: {
        color: '#3498db',
        fontWeight: '600',
    },
    activeRoleText: {
        color: '#fff',
    },
    chipContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    activeChip: {
        backgroundColor: '#3498db',
    },
    chipText: {
        color: '#7f8c8d',
    },
    activeChipText: {
        color: '#fff',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#2ecc71',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ManageUsers;
