import React, { useState, useEffect } from "react";
import ApiService from "../../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, BookOpen, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StudentMarks = () => {
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarks();
    }, []);

    const loadMarks = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getStudentMarks();
            setMarks(res?.marks || []);
        } catch (err) {
            console.error("Failed to load marks", err);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-indigo-100">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Average Grade</p>
                                <h3 className="text-3xl font-black">A</h3>
                            </div>
                            <Award className="w-8 h-8 text-indigo-200 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Tests</p>
                                <h3 className="text-3xl font-black">{marks.length}</h3>
                            </div>
                            <BookOpen className="w-8 h-8 text-blue-200 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Highest Score</p>
                                <h3 className="text-3xl font-black text-slate-900">
                                    {marks.length > 0 ? Math.max(...marks.map(m => m.percentage)) : 0}%
                                </h3>
                            </div>
                            <TrendingUp className="w-8 h-8 text-slate-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-xl rounded-3xl overflow-hidden border-none bg-white">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
                    <CardTitle className="flex items-center gap-3 text-slate-900">
                        <div className="p-2 bg-indigo-100 rounded-xl">
                            <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        Academic Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow className="border-slate-100 hover:bg-transparent">
                                <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-slate-400">Subject</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Assessment</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Marks</TableHead>
                                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Percentage</TableHead>
                                <TableHead className="py-4 pr-6 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {marks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                                <AlertCircle className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900">No marks released yet</p>
                                                <p className="text-sm text-slate-400">Your grades will appear here once faculty uploads them.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                marks.map((m) => (
                                    <TableRow key={m.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-4 pl-6 font-bold text-slate-900">{m.course}</TableCell>
                                        <TableCell className="py-4 text-slate-600 text-sm font-medium">{m.assessment}</TableCell>
                                        <TableCell className="py-4 text-slate-900 font-bold">
                                            {m.marks_obtained} <span className="text-slate-300 font-normal">/ {m.total_marks}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${m.percentage >= 75 ? 'bg-emerald-500' : m.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                                        style={{ width: `${m.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{m.percentage}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 pr-6 text-right">
                                            <Badge className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${m.percentage >= 40 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                                                {m.percentage >= 40 ? 'PASSED' : 'FAILED'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentMarks;
