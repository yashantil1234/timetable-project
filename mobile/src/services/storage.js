// Storage service using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
    async setItem(key, value) {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
            return true;
        } catch (error) {
            console.error(`Error storing ${key}:`, error);
            return false;
        }
    }

    async getItem(key) {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (error) {
            console.error(`Error retrieving ${key}:`, error);
            return null;
        }
    }

    async removeItem(key) {
        try {
            await AsyncStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return false;
        }
    }

    async clear() {
        try {
            await AsyncStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    // Specific methods for auth tokens
    async setToken(token) {
        return this.setItem('token', token);
    }

    async getToken() {
        return this.getItem('token');
    }

    async setUserData(userData) {
        return this.setItem('userData', userData);
    }

    async getUserData() {
        return this.getItem('userData');
    }

    async clearAuth() {
        await this.removeItem('token');
        await this.removeItem('userData');
    }
}

export default new StorageService();
