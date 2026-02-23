import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Bell, Send, CheckCircle, AlertCircle } from 'lucide-react';
import ApiService from '../../services/api';

const AdminNotificationManager = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target_audience: 'all', // all, role, user
        target_role: 'student', // student, teacher
        target_user_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const payload = {
                title: formData.title,
                message: formData.message,
                target_audience: formData.target_audience
            };

            if (formData.target_audience === 'role') {
                payload.target_role = formData.target_role;
            } else if (formData.target_audience === 'user') {
                payload.target_user_id = formData.target_user_id;
            }

            const response = await ApiService.sendNotification(payload);

            setStatus({
                type: 'success',
                message: response.message || 'Notification sent successfully!'
            });

            // Reset form
            setFormData({
                title: '',
                message: '',
                target_audience: 'all',
                target_role: 'student',
                target_user_id: ''
            });

        } catch (err) {
            console.error(err);
            setStatus({
                type: 'error',
                message: err.message || 'Failed to send notification'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                    <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notification Manager</h1>
                    <p className="text-gray-500">Send announcements and alerts to users</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Send New Notification</CardTitle>
                    <CardDescription>Compose a message to send to students, teachers, or specific users.</CardDescription>
                </CardHeader>
                <CardContent>
                    {status.message && (
                        <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="target_audience">Target Audience</Label>
                                <Select
                                    value={formData.target_audience}
                                    onValueChange={(val) => handleSelectChange('target_audience', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="role">Specific Role</SelectItem>
                                        <SelectItem value="user">Specific User (ID)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.target_audience === 'role' && (
                                <div className="space-y-2">
                                    <Label htmlFor="target_role">Select Role</Label>
                                    <Select
                                        value={formData.target_role}
                                        onValueChange={(val) => handleSelectChange('target_role', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Students</SelectItem>
                                            <SelectItem value="teacher">Teachers</SelectItem>
                                            <SelectItem value="admin">Admins</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {formData.target_audience === 'user' && (
                                <div className="space-y-2">
                                    <Label htmlFor="target_user_id">User ID</Label>
                                    <Input
                                        id="target_user_id"
                                        name="target_user_id"
                                        placeholder="Enter User ID"
                                        value={formData.target_user_id}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="Notification Title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Type your message here..."
                                value={formData.message}
                                onChange={handleChange}
                                required
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                                {loading ? 'Sending...' : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Notification
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminNotificationManager;
