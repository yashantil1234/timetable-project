import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Bell, Send, CheckCircle, AlertCircle, Search, Paperclip, X, FileText, Image, FileSpreadsheet, File, Loader2, Users, Building2, BookOpen, User } from 'lucide-react';
import ApiService from '../../services/api';

const ALLOWED_EXT_LABEL = 'PDF, Word (.docx), Excel (.xlsx), PNG, JPG';

function FileIcon({ fileType, className = 'w-5 h-5' }) {
    if (!fileType) return <File className={className} />;
    const t = fileType.toLowerCase();
    if (t === 'pdf') return <FileText className={`${className} text-red-500`} />;
    if (t === 'docx' || t === 'doc') return <FileText className={`${className} text-blue-500`} />;
    if (t === 'xlsx' || t === 'xls' || t === 'csv') return <FileSpreadsheet className={`${className} text-green-500`} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(t)) return <Image className={`${className} text-purple-500`} />;
    return <File className={className} />;
}

const AdminNotificationManager = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target_audience: 'all', // all, role, user, department, section
        target_role: 'student', // student, teacher, admin
        target_user_id: '',
        target_dept_id: '',
        target_section_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [users, setUsers] = useState([]);
    const [targets, setTargets] = useState({ users: [], departments: [], sections: [] });
    const [targetsLoading, setTargetsLoading] = useState(false);

    // File State
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef(null);
    
    // Custom Combobox State
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            setTargetsLoading(true);
            try {
                // Fetch all targets for the advanced selector
                const data = await ApiService.getNotificationTargets();
                if (data) {
                    setTargets(data);
                    // Also keep the existing users list for the specific user search
                    setUsers(data.users || []);
                }
            } catch (err) {
                console.error("Failed to fetch notification targets:", err);
            } finally {
                setTargetsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateAndSetFile = (file) => {
        if (file.size > 5 * 1024 * 1024) {
            setStatus({ type: 'error', message: 'File too large. Maximum size is 5MB.' });
            return;
        }
        const ext = file.name.split('.').pop().toLowerCase();
        const allowed = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'csv'];
        if (!allowed.includes(ext)) {
            setStatus({ type: 'error', message: `Invalid file type. Allowed: ${ALLOWED_EXT_LABEL}` });
            return;
        }
        setStatus({ type: '', message: '' });
        setSelectedFile(file);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) validateAndSetFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prevent double submission
        if (loading) return;
        
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            // Audience Validation
            if (formData.target_audience === 'user' && !formData.target_user_id) {
                throw new Error("Please select a specific user.");
            }
            if (formData.target_audience === 'department' && !formData.target_dept_id) {
                throw new Error("Please select a department.");
            }
            if (formData.target_audience === 'section' && !formData.target_section_id) {
                throw new Error("Please select a section.");
            }

            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('message', formData.message);
            fd.append('target_audience', formData.target_audience);

            if (formData.target_audience === 'role') {
                fd.append('target_role', formData.target_role);
            } else if (formData.target_audience === 'user') {
                fd.append('target_user_id', formData.target_user_id);
            } else if (formData.target_audience === 'department') {
                fd.append('target_dept_id', formData.target_dept_id);
            } else if (formData.target_audience === 'section') {
                fd.append('target_section_id', formData.target_section_id);
            }

            if (selectedFile) {
                fd.append('file', selectedFile);
            }

            const response = await ApiService.sendNotificationWithFile(fd);

            setStatus({
                type: 'success',
                message: response.message || '✅ Notification sent successfully!'
            });

            // Reset form and file state
            setFormData({
                title: '',
                message: '',
                target_audience: 'all',
                target_role: 'student',
                target_user_id: '',
                target_dept_id: '',
                target_section_id: ''
            });
            setSearchQuery('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

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

    const filteredUsers = users.filter(u => {
        const rawName = u.full_name || u.name || '';
        const nameMatch = rawName.toLowerCase().includes(searchQuery.toLowerCase());
        const usernameMatch = (u.username || '').toLowerCase().includes(searchQuery.toLowerCase());
        const idMatch = ((u.id || u.user_id || '') + '').toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || usernameMatch || idMatch;
    });

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
                                    onValueChange={(val) => {
                                        handleSelectChange('target_audience', val);
                                        if (val !== 'user') setSearchQuery('');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Everyone</SelectItem>
                                        <SelectItem value="role">By Role</SelectItem>
                                        <SelectItem value="department">By Department</SelectItem>
                                        <SelectItem value="section">By Section (Students)</SelectItem>
                                        <SelectItem value="user">Specific Person</SelectItem>
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
                                            <SelectItem value="student">All Students</SelectItem>
                                            <SelectItem value="teacher">All Teachers</SelectItem>
                                            <SelectItem value="admin">All Admins</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {formData.target_audience === 'department' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <Label>Select Department</Label>
                                    {targetsLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 p-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.target_dept_id}
                                            onValueChange={(val) => handleSelectChange('target_dept_id', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a department..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {targets.departments.map(d => (
                                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}

                            {formData.target_audience === 'section' && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-2">
                                        <Label>Filter by Department (optional)</Label>
                                        <Select
                                            value={formData.target_dept_id}
                                            onValueChange={(val) => {
                                                handleSelectChange('target_dept_id', val);
                                                handleSelectChange('target_section_id', '');
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All departments..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {targets.departments.map(d => (
                                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Select Section <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={formData.target_section_id}
                                            onValueChange={(val) => handleSelectChange('target_section_id', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a section..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-52">
                                                {targets.sections
                                                    .filter(s => !formData.target_dept_id || s.dept_id === parseInt(formData.target_dept_id))
                                                    .map(s => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            <div className="flex flex-col text-left">
                                                                <span className="font-medium">Year {s.year} – {s.name}</span>
                                                                {s.dept_name && <span className="text-[10px] opacity-70 italic">{s.dept_name}</span>}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {formData.target_audience === 'user' && (
                                <div className="space-y-2 relative">
                                    <Label htmlFor="target_user_id">Search User</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            className="pl-9"
                                            placeholder="Type name or username..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setShowDropdown(true);
                                                handleSelectChange('target_user_id', ''); // clear actual selection while typing
                                            }}
                                            onFocus={() => setShowDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                            required={!formData.target_user_id}
                                        />
                                    </div>
                                    
                                    {showDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((u) => {
                                                    const userId = u.id || u.user_id;
                                                    const displayName = u.full_name || u.name || 'Unknown User';
                                                    const displayUsername = u.username ? `(@${u.username})` : '';
                                                    return (
                                                        <div 
                                                            key={userId} 
                                                            className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Prevent input from losing focus
                                                                handleSelectChange('target_user_id', userId);
                                                                setSearchQuery(`${displayName} ${displayUsername}`);
                                                                setShowDropdown(false);
                                                            }}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-900">{displayName} <span className="text-gray-500 font-normal">{displayUsername}</span></span>
                                                            </div>
                                                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full capitalize">{u.role}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="px-4 py-3 text-sm text-gray-500 italic text-center">No users found matching "{searchQuery}"</div>
                                            )}
                                        </div>
                                    )}
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

                        {/* File Attachment */}
                        <div className="space-y-4 border-t pt-6">
                            <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                Attach Document or Image
                                <span className="text-xs text-slate-400 font-normal">(optional · max 5MB)</span>
                            </Label>

                            {selectedFile ? (
                                <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                                    {/* Image Preview */}
                                    {selectedFile.type.startsWith('image/') && (
                                        <div className="relative w-full max-h-48 rounded-xl overflow-hidden border bg-slate-50 group">
                                            <img 
                                                src={URL.createObjectURL(selectedFile)} 
                                                alt="Preview" 
                                                className="w-full h-48 object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                    )}

                                    {/* File Info Card */}
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-100">
                                            <FileIcon fileType={selectedFile.name.split('.').pop()} className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate" title={selectedFile.name}>
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">
                                                {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.name.split('.').pop()}
                                            </p>
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleFileDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                                        flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed 
                                        cursor-pointer transition-all duration-300
                                        ${isDragging 
                                            ? 'border-blue-500 bg-blue-50/80 scale-[1.02] shadow-inner' 
                                            : 'border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                                        ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}
                                    `}>
                                        <Paperclip className={isDragging ? 'w-6 h-6 animate-bounce' : 'w-6 h-6'} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-slate-700">
                                            {isDragging ? 'Drop it here!' : 'Click to select or drag & drop'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                                            {ALLOWED_EXT_LABEL} <br/> (Maximum file size 5MB)
                                        </p>
                                    </div>
                                </div>
                            )}

                            <input 
                                ref={fileInputRef} 
                                type="file" 
                                className="hidden"
                                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.csv"
                                onChange={e => { if (e.target.files[0]) validateAndSetFile(e.target.files[0]); }} 
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button 
                                type="submit" 
                                disabled={loading || !formData.title || !formData.message} 
                                className={`
                                    w-full md:w-auto min-w-[160px] h-12 gap-2 text-white shadow-lg transition-all
                                    ${loading ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}
                                `}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Send Notification</span>
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
