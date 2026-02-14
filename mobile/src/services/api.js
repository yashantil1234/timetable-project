// API Service - Adapted from web frontend
import storageService from './storage';
import { API_BASE_URL } from '../utils/constants';

class ApiService {
    constructor() {
        this.token = null;
    }

    // Update token from storage
    async updateToken() {
        this.token = await storageService.getToken();
    }

    // Helper method to make authenticated requests
    async makeRequest(url, options = {}) {
        await this.updateToken();

        const headers = {
            ...options.headers
        };

        // Don't set Content-Type for FormData or GET requests
        if (!(options.body instanceof FormData) && options.method !== 'GET') {
            headers['Content-Type'] = 'application/json';
        }

        if (this.token) {
            headers['x-access-token'] = this.token;
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers
            });

            // Handle different response statuses
            if (response.status === 401) {
                await this.logout();
                return null;
            }

            // Parse response body
            let responseData;
            const contentType = response.headers.get('content-type');

            try {
                if (contentType && contentType.includes('application/json')) {
                    responseData = await response.json();
                } else {
                    const text = await response.text();
                    responseData = text ? { message: text } : { success: response.ok };
                }
            } catch (parseError) {
                responseData = {
                    error: 'Failed to parse response',
                    status: response.status,
                    statusText: response.statusText
                };
            }

            // Handle error status codes
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error(responseData.error || responseData.message || 'Access forbidden');
                }

                if (response.status === 404) {
                    throw new Error(responseData.error || responseData.message || 'Resource not found');
                }

                if (response.status >= 500) {
                    throw new Error(responseData.error || responseData.message || 'Server error');
                }

                if (response.status >= 400) {
                    throw new Error(responseData.error || responseData.message || `Request failed with status ${response.status}`);
                }
            }

            return responseData;
        } catch (error) {
            // Enhanced error message with URL for debugging
            if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
                throw new Error(`Network error - please check your connection\nAttempted URL: ${API_BASE_URL}${url}`);
            }
            throw error;
        }
    }

    // ==================== AUTHENTICATION ====================

    async login(username, password) {
        const response = await this.makeRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response && response.token) {
            await storageService.setToken(response.token);
            await storageService.setUserData({
                role: response.role,
                user_id: response.user_id,
                full_name: response.full_name || '',
                department: response.department || ''
            });
            this.token = response.token;
        }

        return response;
    }

    async adminLogin(username, password) {
        const response = await this.makeRequest('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response && response.token) {
            await storageService.setToken(response.token);
            await storageService.setUserData({
                role: response.role,
                user_id: response.user_id
            });
            this.token = response.token;
        }

        return response;
    }

    async logout() {
        await storageService.clearAuth();
        this.token = null;
    }

    async isAuthenticated() {
        const token = await storageService.getToken();
        return !!token;
    }

    async getCurrentUser() {
        return await storageService.getUserData();
    }

    // ==================== TIMETABLE ====================

    async getTimetable(filters = {}) {
        const params = new URLSearchParams();

        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });

        const queryString = params.toString();
        return this.makeRequest(`/get_timetable${queryString ? `?${queryString}` : ''}`);
    }

    async getStudentTimetable() {
        return this.makeRequest('/student/timetable');
    }

    async getTeacherTimetable() {
        return this.makeRequest('/teacher/timetable');
    }

    // ==================== STUDENT ====================

    async getStudentProfile() {
        return this.makeRequest('/student/profile');
    }

    // ==================== TEACHER ====================

    async getRoomStatus() {
        return this.makeRequest('/rooms/status');
    }

    async markRoom(roomId, status, notes = '') {
        return this.makeRequest('/teacher/mark_room', {
            method: 'POST',
            body: JSON.stringify({ room_id: roomId, status, notes })
        });
    }

    async getTeacherSwapRequests() {
        return this.makeRequest('/teacher/swap-requests');
    }

    async createSwapRequest(swapData) {
        return this.makeRequest('/teacher/swap-requests', {
            method: 'POST',
            body: JSON.stringify(swapData)
        });
    }

    // ==================== LEAVE REQUESTS ====================

    async submitLeaveRequest(leaveData) {
        return this.makeRequest('/leave/request', {
            method: 'POST',
            body: JSON.stringify(leaveData)
        });
    }

    async getMyLeaveRequests(status = null) {
        let url = '/leave/my-requests';
        if (status) url += `?status=${status}`;
        return this.makeRequest(url);
    }

    async getLeaveRequestDetails(requestId) {
        return this.makeRequest(`/leave/request/${requestId}`);
    }

    async cancelLeaveRequest(requestId) {
        return this.makeRequest(`/leave/request/${requestId}`, {
            method: 'DELETE'
        });
    }

    // ==================== ADMIN ====================

    async getAdminSwapRequests(status = 'pending') {
        return this.makeRequest(`/admin/swap-requests?status=${status}`);
    }

    async getAdminLeaveRequests(status = 'pending') {
        return this.makeRequest(`/admin/leave-requests?status=${status}`);
    }

    async adminApproveSwap(requestId) {
        return this.makeRequest(`/admin/swap-requests/${requestId}/approve`, {
            method: 'POST'
        });
    }

    async adminRejectSwap(requestId, reason = "") {
        return this.makeRequest(`/admin/swap-requests/${requestId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async adminApproveLeave(requestId, notes = "") {
        return this.makeRequest(`/admin/leave-requests/${requestId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ admin_notes: notes })
        });
    }

    async adminRejectLeave(requestId, notes = "") {
        return this.makeRequest(`/admin/leave-requests/${requestId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ admin_notes: notes })
        });
    }

    async getUsers() {
        return this.makeRequest('/admin/users');
    }

    async getAdminStats() {
        return this.makeRequest('/admin/stats');
    }

    async registerUser(userData) {
        return this.makeRequest('/admin/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getDepartments() {
        // Use teacher endpoint instead of admin endpoint
        return this.makeRequest('/teacher/departments');
    }

    async getSections(deptName, year) {
        // Use teacher endpoint instead of admin endpoint
        let url = '/teacher/sections';
        const params = [];
        if (deptName) params.push(`department=${deptName}`);
        if (year) params.push(`year=${year}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        return this.makeRequest(url);
    }

    async deleteStudent(studentId) {
        return this.makeRequest(`/admin/students/${studentId}`, {
            method: 'DELETE'
        });
    }

    async deleteFaculty(facultyId) {
        return this.makeRequest(`/admin/faculty/${facultyId}`, {
            method: 'DELETE'
        });
    }

    // Admin: Swap Requests
    async getAllSwapRequests(status = 'pending') {
        return this.makeRequest(`/admin/swap-requests?status=${status}`);
    }

    // The following methods are already defined above,
    // but if you intended to change their implementation to a different makeRequest signature,
    // please ensure your makeRequest method supports it.
    // For now, I'm keeping the existing implementations as they are compatible with the current makeRequest.

    // async adminApproveSwap(requestId) {
    //     return this.makeRequest(`/admin/swap-requests/${requestId}/approve`, 'POST');
    // }

    // async adminRejectSwap(requestId, reason) {
    //     return this.makeRequest(`/admin/swap-requests/${requestId}/reject`, 'POST', { reason });
    // }

    // Admin: Leave Requests
    async getAllLeaveRequests(status = 'pending') {
        return this.makeRequest(`/admin/leave-requests?status=${status}`);
    }

    // The following methods are already defined above,
    // but if you intended to change their implementation to a different makeRequest signature,
    // please ensure your makeRequest method supports it.
    // For now, I'm keeping the existing implementations as they are compatible with the current makeRequest.

    // async adminRejectLeave(requestId, notes) {
    //     return this.makeRequest(`/admin/leave-requests/${requestId}/approve`, 'POST', { admin_notes: notes });
    // }

    // async adminRejectLeave(requestId, notes) {
    //     return this.makeRequest(`/admin/leave-requests/${requestId}/reject`, 'POST', { admin_notes: notes });
    // }

    // ==================== CHAT & ANNOUNCEMENTS ====================

    async sendChatMessage(message) {
        return this.makeRequest('/api/chatbot', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async getChatHistory() {
        return this.makeRequest('/api/conversation');
    }

    async clearChatHistory() {
        return this.makeRequest('/api/clear', {
            method: 'POST'
        });
    }

    async getAnnouncements() {
        return this.makeRequest('/api/announcements');
    }

    // ==================== ATTENDANCE ====================

    async getDetailedAttendance() {
        return this.makeRequest('/student/attendance/details');
    }

    async getStudentsForSection(department, year, section) {
        const params = new URLSearchParams({ department, year, section });
        return this.makeRequest(`/teacher/students?${params.toString()}`);
    }

    async markAttendance(attendanceData) {
        return this.makeRequest('/teacher/mark-attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }
}

export default new ApiService();
