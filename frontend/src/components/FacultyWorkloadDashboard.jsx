import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { API_URL } from '../api';

const FacultyWorkloadDashboard = () => {
    const [workload, setWorkload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWorkload();
    }, []);

    const fetchWorkload = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/teacher/workload/current`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch workload');

            const data = await response.json();
            setWorkload(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'underloaded': return 'text-blue-600 bg-blue-50';
            case 'balanced': return 'text-green-600 bg-green-50';
            case 'overloaded': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'underloaded': return '📉';
            case 'balanced': return '✅';
            case 'overloaded': return '⚠️';
            default: return '📊';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading workload data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!workload) return null;

    // Calculate percentages for visual display
    const teachingPercentage = (workload.total_teaching_hours / workload.max_hours_allowed) * 100;
    const meetingPercentage = (workload.total_meeting_hours / workload.max_hours_allowed) * 100;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Faculty Workload Dashboard</span>
                        <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(workload.status)}`}>
                            {getStatusIcon(workload.status)} {workload.status.toUpperCase()}
                        </span>
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        Week {workload.week_number}, {workload.year} • {workload.faculty_name}
                    </p>
                </CardHeader>
                <CardContent>
                    {/* Overall Workload Meter */}
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Overall Workload</span>
                            <span className="text-sm font-bold">{workload.total_hours}h / {workload.max_hours_allowed}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${workload.status === 'overloaded' ? 'bg-red-500' :
                                        workload.status === 'balanced' ? 'bg-green-500' :
                                            'bg-blue-500'
                                    }`}
                                style={{ width: `${Math.min(workload.workload_percentage, 100)}%` }}
                            />
                        </div>
                        <div className="text-right mt-1">
                            <span className="text-xs text-gray-600">{workload.workload_percentage}%</span>
                        </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Teaching Hours */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-900">📚 Teaching Hours</span>
                                <span className="text-2xl font-bold text-blue-700">{workload.total_teaching_hours}h</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${Math.min(teachingPercentage, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-blue-700 mt-1">
                                {teachingPercentage.toFixed(1)}% of weekly capacity
                            </p>
                        </div>

                        {/* Meeting Hours */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-purple-900">🤝 Meeting Hours</span>
                                <span className="text-2xl font-bold text-purple-700">{workload.total_meeting_hours}h</span>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-2">
                                <div
                                    className="h-full bg-purple-600 rounded-full"
                                    style={{ width: `${Math.min(meetingPercentage, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-purple-700 mt-1">
                                {meetingPercentage.toFixed(1)}% of weekly capacity
                            </p>
                        </div>
                    </div>

                    {/* Workload Status Alert */}
                    {workload.status === 'overloaded' && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertDescription>
                                ⚠️ You are currently overloaded. Consider rescheduling some meetings or contacting admin.
                            </AlertDescription>
                        </Alert>
                    )}

                    {workload.status === 'underloaded' && (
                        <Alert className="mt-4 bg-blue-50 border-blue-200">
                            <AlertDescription className="text-blue-800">
                                📉 You have additional capacity available for more classes or meetings.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-800">{workload.total_hours}</div>
                            <div className="text-sm text-gray-500 mt-1">Total Hours This Week</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-800">{workload.max_hours_allowed - workload.total_hours}</div>
                            <div className="text-sm text-gray-500 mt-1">Hours Remaining</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-800">{workload.workload_percentage}%</div>
                            <div className="text-sm text-gray-500 mt-1">Capacity Utilized</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FacultyWorkloadDashboard;
