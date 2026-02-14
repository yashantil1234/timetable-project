// Simple Loading Screen
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

const LoadingScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.logo}>📅</Text>
                <ActivityIndicator size="large" color="#3498db" style={styles.spinner} />
                <Text style={styles.text}>Loading...</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        fontSize: 60,
        marginBottom: 20,
    },
    spinner: {
        marginVertical: 20,
    },
    text: {
        fontSize: 16,
        color: '#95a5a6',
        marginTop: 10,
    },
});

export default LoadingScreen;

