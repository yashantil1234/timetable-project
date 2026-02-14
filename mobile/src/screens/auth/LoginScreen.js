// Login Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('student');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(username, password, userType);

            if (!result.success) {
                Alert.alert('Login Failed', result.error || 'Invalid credentials');
            }
            // Navigation will happen automatically via auth state change
        } catch (error) {
            Alert.alert('Error', error.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const quickLogin = (type) => {
        const credentials = {
            admin: { username: 'admin', password: 'password123', userType: 'admin' },
            teacher: { username: 'teacher1', password: 'password123', userType: 'teacher' },
            student: { username: 'student1', password: 'password123', userType: 'student' }
        };

        const cred = credentials[type];
        setUsername(cred.username);
        setPassword(cred.password);
        setUserType(cred.userType);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.headerContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>📅</Text>
                    </View>
                    <Text style={styles.title}>Timetable Management</Text>
                    <Text style={styles.subtitle}>Sign in to access your dashboard</Text>
                </View>

                <View style={styles.formContainer}>
                    {/* User Type Selector */}
                    <Text style={styles.label}>I am a</Text>
                    <View style={styles.userTypeContainer}>
                        {['student', 'teacher', 'admin'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.userTypeButton,
                                    userType === type && styles.userTypeButtonActive
                                ]}
                                onPress={() => setUserType(type)}
                                disabled={isLoading}
                            >
                                <Text
                                    style={[
                                        styles.userTypeText,
                                        userType === type && styles.userTypeTextActive
                                    ]}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Username Input */}
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter your username"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />

                    {/* Password Input */}
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Quick Login Buttons */}
                    <View style={styles.quickLoginContainer}>
                        <Text style={styles.quickLoginTitle}>Quick Login (Development)</Text>
                        <View style={styles.quickLoginButtons}>
                            <TouchableOpacity
                                style={[styles.quickLoginBtn, styles.quickLoginBtnStudent]}
                                onPress={() => quickLogin('student')}
                                disabled={isLoading}
                            >
                                <Text style={styles.quickLoginBtnText}>👨‍🎓 Student</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.quickLoginBtn, styles.quickLoginBtnTeacher]}
                                onPress={() => quickLogin('teacher')}
                                disabled={isLoading}
                            >
                                <Text style={styles.quickLoginBtnText}>👨‍🏫 Teacher</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.quickLoginBtn, styles.quickLoginBtnAdmin]}
                                onPress={() => quickLogin('admin')}
                                disabled={isLoading}
                            >
                                <Text style={styles.quickLoginBtnText}>👤 Admin</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <Text style={styles.footer}>© 2026 Timetable Management System</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#95a5a6',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
        marginTop: 12,
    },
    userTypeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    userTypeButton: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    userTypeButtonActive: {
        borderColor: '#3498db',
        backgroundColor: '#3498db',
    },
    userTypeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#95a5a6',
    },
    userTypeTextActive: {
        color: '#fff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    loginButton: {
        backgroundColor: '#3498db',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    loginButtonDisabled: {
        backgroundColor: '#95a5a6',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    quickLoginContainer: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    quickLoginTitle: {
        fontSize: 14,
        color: '#95a5a6',
        textAlign: 'center',
        marginBottom: 12,
    },
    quickLoginButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickLoginBtn: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    quickLoginBtnStudent: {
        backgroundColor: '#3498db20',
    },
    quickLoginBtnTeacher: {
        backgroundColor: '#2ecc7120',
    },
    quickLoginBtnAdmin: {
        backgroundColor: '#e74c3c20',
    },
    quickLoginBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        textAlign: 'center',
        color: '#95a5a6',
        fontSize: 12,
        marginTop: 20,
    },
});

export default LoginScreen;
