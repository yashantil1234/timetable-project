
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User } from "lucide-react";

import ApiService from '../../services/api';

export default function RecentLeaveRequests({ requests = [], isLoading = false, onUpdate }) {
    const handleAction = async (id, action) => {
        try {
            if (action === 'approve') {
                if (confirm('Approve this leave request?')) {
                    await ApiService.adminApproveLeave(id);
                    alert('Leave request approved');
                }
            } else {
                const notes = prompt('Enter rejection notes:');
                if (notes) {
                    await ApiService.adminRejectLeave(id, notes);
                    alert('Leave request rejected');
                }
            }
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            alert('Action failed: ' + error.message);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Pending Leave Requests
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {requests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No pending leave requests
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div
                                key={request.id}
                                className="group p-4 rounded-xl bg-blue-50/50 border border-blue-100 hover:bg-blue-50 hover:border-blue-200 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{request.full_name}</h4>
                                            <p className="text-xs text-gray-500">{request.department}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                        {request.leave_type}
                                    </Badge>
                                </div>

                                <div className="mt-3 space-y-1 mb-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>{request.start_date} - {request.end_date}</span>
                                        <span className="text-xs bg-gray-200 px-1 rounded">({request.days_requested} days)</span>
                                    </div>
                                    <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">"{request.reason}"</p>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => handleAction(request.id, 'approve')}
                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(request.id, 'reject')}
                                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
