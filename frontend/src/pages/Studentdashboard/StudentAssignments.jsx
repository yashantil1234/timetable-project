import React, { useState, useEffect } from "react";
import ApiService from "../../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Loader2, ExternalLink, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const StudentAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getStudentAssignments();
            setAssignments(res?.assignments || []);
        } catch (err) {
            console.error("Failed to load assignments", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-8 h-8 text-blue-600 p-1.5 bg-blue-50 rounded-lg" />
                    My Assignments
                </h2>
                <Badge className="bg-blue-600 text-white border-none py-1.5 px-4 rounded-full font-bold shadow-lg shadow-blue-100">
                    {assignments.length} Total
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                            <FileText className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="font-bold text-slate-900">No active assignments</h3>
                        <p className="text-slate-400 text-sm">Great job! You're all caught up for now.</p>
                    </div>
                ) : (
                    assignments.map((a) => {
                        const dueDate = a.due_date ? new Date(a.due_date) : null;
                        const isOverdue = dueDate && dueDate < new Date();
                        
                        return (
                            <Card key={a.id} className="group relative overflow-hidden rounded-3xl border-none shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                <div className={`h-2 w-full bg-gradient-to-r ${isOverdue ? 'from-rose-500 to-rose-600' : 'from-blue-500 to-indigo-600'}`} />
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        {a.file_url ? (
                                            <a 
                                                href={`${ApiService.getBaseURL()}${a.file_url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Get File
                                            </a>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400 border-slate-100 bg-slate-50">NO ATTACHMENT</Badge>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition leading-tight mb-1">{a.title}</h4>
                                            <p className="text-sm text-slate-400 font-medium">{a.course_name || 'General'}</p>
                                        </div>

                                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                                            {a.description || "Refer to the attached file for instructions and requirements."}
                                        </p>

                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="text-[11px]">
                                                    <p className="text-slate-400 font-bold uppercase tracking-wider">Due Date</p>
                                                    <p className={`font-black ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                                                        {dueDate ? dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter bg-slate-50 text-slate-500 border border-slate-100">
                                                BY {a.created_by.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentAssignments;
