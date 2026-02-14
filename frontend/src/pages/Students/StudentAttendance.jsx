import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import './StudentAttendance.css';

const StudentAttendance = () => {
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState(0);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const data = await apiService.getDetailedAttendance();
            setAttendance(data.overall_attendance || 0);
            setSubjects(data.subjects || []);
        } catch (error) {
            setError(error.message || 'Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (percent) => {
        if (percent >= 75) return '#2ecc71'; // Green
        if (percent >= 60) return '#f1c40f'; // Yellow
        return '#e74c3c'; // Red
    };

    const getStatusLabel = (percent) => {
        if (percent >= 75) return 'Safe';
        if (percent >= 60) return 'Warning';
        return 'Critical';
    };

    if (loading) {
        return (
            <div className="attendance-container">
                <div className="loading">Loading attendance...</div>
            </div>
        );
    }

    const overallColor = getStatusColor(attendance);

    return (
        <div className="attendance-container">
            <div className="page-header">
                <button className="back-button" onClick={() => navigate('/student')}>
                    ← Back to Dashboard
                </button>
                <h1>My Attendance</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="overall-card">
                <h2>Overall Attendance</h2>
                <div className="attendance-circle" style={{ borderColor: overallColor }}>
                    <div className="percentage" style={{ color: overallColor }}>
                        {attendance}%
                    </div>
                    <div className="status-label" style={{ color: overallColor }}>
                        {getStatusLabel(attendance)}
                    </div>
                </div>
                <p className="attendance-message">
                    {attendance >= 75
                        ? "You have good attendance! Keep it up. 🌟"
                        : "Your attendance is low. Please attend more classes. ⚠️"}
                </p>
            </div>

            {subjects.length > 0 ? (
                <div className="subjects-card">
                    <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Subject-wise Attendance</h2>

                        {/* Filter Dropdown */}
                        <div className="filter-group">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    fontSize: '0.9rem',
                                    outline: 'none'
                                }}
                            >
                                <option value="all">All Subjects</option>
                                {subjects.map((s, i) => (
                                    <option key={i} value={s.course_name}>{s.course_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="subjects-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Total Classes</th>
                                    <th>Percentage</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects
                                    .filter(s => selectedSubject === 'all' || s.course_name === selectedSubject)
                                    .map((subject, index) => {
                                        const color = getStatusColor(subject.percentage);
                                        return (
                                            <tr key={index}>
                                                <td className="subject-name">{subject.course_name}</td>
                                                <td className="present-count">{subject.present + subject.late}</td>
                                                <td className="absent-count">{subject.absent}</td>
                                                <td>{subject.total_classes}</td>
                                                <td>
                                                    <span className="percentage-badge" style={{ backgroundColor: color }}>
                                                        {subject.percentage}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="status-label" style={{ color: color }}>
                                                        {getStatusLabel(subject.percentage)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="no-data-card">
                    <h2>No Attendance Records</h2>
                    <p>Attendance has not been marked yet. Check back after your teachers mark attendance.</p>
                </div>
            )}

            <div className="legend-card">
                <h3>Attendance Criteria</h3>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="legend-dot" style={{ backgroundColor: '#2ecc71' }}></div>
                        <span>75% and above (Safe)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ backgroundColor: '#f1c40f' }}></div>
                        <span>60% - 74% (Warning)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ backgroundColor: '#e74c3c' }}></div>
                        <span>Below 60% (Critical)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
