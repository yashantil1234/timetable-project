
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, ArrowRightLeft, FileText, Loader2 } from "lucide-react";
import ApiService from "../../services/api";

export default function MyRequestsModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState("swaps");
    const [swaps, setSwaps] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
        }
    }, [isOpen]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const [swapsData, leavesData] = await Promise.all([
                ApiService.getMySwapRequests(),
                ApiService.getMyLeaveRequests()
            ]);
            setSwaps(swapsData || []);
            setLeaves(leavesData || []);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>My Requests</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="swaps" value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="swaps">Swap Requests ({swaps.length})</TabsTrigger>
                        <TabsTrigger value="leaves">Leave Requests ({leaves.length})</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-4 pr-2">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <>
                                <TabsContent value="swaps" className="space-y-4">
                                    {swaps.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8">No swap requests found.</div>
                                    ) : (
                                        swaps.map((req) => (
                                            <div key={req.id} className="border rounded-lg p-4 bg-gray-50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                        <ArrowRightLeft className="w-4 h-4 text-orange-500" />
                                                        {req.course_name}
                                                    </h4>
                                                    {getStatusBadge(req.status)}
                                                </div>
                                                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="font-medium">Original:</span> {req.original_day} {req.original_start_time}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Proposed:</span> {req.proposed_day} {req.proposed_start_time}
                                                    </div>
                                                </div>
                                                {req.reason && (
                                                    <div className="mt-2 text-xs text-gray-500 italic">
                                                        Reason: "{req.reason}"
                                                    </div>
                                                )}
                                                {req.admin_notes && (
                                                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                                                        Admin Note: {req.admin_notes}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </TabsContent>

                                <TabsContent value="leaves" className="space-y-4">
                                    {leaves.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8">No leave requests found.</div>
                                    ) : (
                                        leaves.map((req) => (
                                            <div key={req.id} className="border rounded-lg p-4 bg-gray-50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-blue-500" />
                                                        {req.leave_type.charAt(0).toUpperCase() + req.leave_type.slice(1)} Leave
                                                    </h4>
                                                    {getStatusBadge(req.status)}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {req.start_date} - {req.end_date} ({req.days_requested} days)
                                                </div>
                                                {req.reason && (
                                                    <div className="mt-2 text-xs text-gray-500 italic">
                                                        Reason: "{req.reason}"
                                                    </div>
                                                )}
                                                {req.admin_notes && (
                                                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                                                        Admin Note: {req.admin_notes}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
