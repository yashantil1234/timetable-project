import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            if (user?.role === 'student') {
                const data = await apiService.getStudentProfile();
                setProfileData(data);
            } else {
                // For teachers/admins, we usually just have the basic user info from auth
                // But we can try to fetch more if endpoints exist.
                // For now, we'll use what we have in 'user' + any specific endpoints
                setProfileData({ ...user });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{getInitials(user?.full_name)}</Text>
                </View>
                <Text style={styles.name}>{user?.full_name}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Username</Text>
                    <Text style={styles.value}>{user?.username || profileData?.roll_number || 'N/A'}</Text>
                </View>

                {user?.role === 'student' && profileData && (
                    <>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Department</Text>
                            <Text style={styles.value}>{profileData.dept_name}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Year</Text>
                            <Text style={styles.value}>{profileData.year}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Section</Text>
                            <Text style={styles.value}>{profileData.section}</Text>
                        </View>
                    </>
                )}

                {user?.role === 'teacher' && (
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Department</Text>
                        <Text style={styles.value}>{user?.dept_id || 'General'}</Text>
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 30,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        elevation: 5,
    },
    avatarText: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 5,
    },
    roleBadge: {
        backgroundColor: '#f1c40f',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 5,
    },
    roleText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 20,
        padding: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#95a5a6',
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    label: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    value: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
