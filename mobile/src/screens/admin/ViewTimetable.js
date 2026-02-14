import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    ScrollView,
    Modal
} from 'react-native';
import apiService from '../../services/api';
// Since I cannot install new packages without user permission, I will use a custom modal picker or simple buttons for now if native picker is not preferred.
// Actually, simple Modal-based selection is often better for RN if no library is standard.
// But for simplicity, I'll use a custom ModalPicker component defined locally.

const ViewTimetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);

    const [selectedDept, setSelectedDept] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    // Modal States
    const [deptModalVisible, setDeptModalVisible] = useState(false);
    const [yearModalVisible, setYearModalVisible] = useState(false);
    const [sectionModalVisible, setSectionModalVisible] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    useEffect(() => {
        if (selectedDept && selectedYear) {
            loadSections();
        } else {
            setSections([]);
            setSelectedSection('');
        }
    }, [selectedDept, selectedYear]);

    const loadDepartments = async () => {
        try {
            const data = await apiService.getDepartments();
            setDepartments(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load departments');
        }
    };

    const loadSections = async () => {
        try {
            const data = await apiService.getSections(selectedDept, selectedYear);
            setSections(data);
        } catch (error) {
            console.error(error);
            // Alert.alert('Error', 'Failed to load sections'); 
            // Often fails if no sections exist, just clear it
            setSections([]);
        }
    };

    const fetchTimetable = async () => {
        if (!selectedDept || !selectedYear || !selectedSection) {
            Alert.alert('Required', 'Please select Department, Year, and Section');
            return;
        }

        setLoading(true);
        try {
            const filters = {
                dept_name: selectedDept,
                year: selectedYear,
                section: selectedSection
            };
            const data = await apiService.getTimetable(filters);
            setTimetable(processTimetableData(data));
            if (data.length === 0) {
                Alert.alert('Info', 'No timetable entries found for this selection.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch timetable');
        } finally {
            setLoading(false);
        }
    };

    const processTimetableData = (data) => {
        // 1. Get unique time slots and sort them
        const times = [...new Set(data.map(item => item.start_time))].sort();

        // 2. Define days
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // 3. Create grid map
        const grid = {};
        data.forEach(item => {
            if (!grid[item.start_time]) grid[item.start_time] = {};
            grid[item.start_time][item.day] = item;
        });

        return { times, days, grid };
    };

    const renderTable = () => {
        if (!timetable.times || timetable.times.length === 0) return null;

        const { times, days, grid } = timetable;

        return (
            <ScrollView horizontal style={styles.tableContainer}>
                <View>
                    {/* Header Row */}
                    <View style={[styles.tableRow, styles.headerRow]}>
                        <View style={[styles.cell, styles.timeCell, styles.headerCell]}>
                            <Text style={styles.headerText}>Time</Text>
                        </View>
                        {days.map(day => (
                            <View key={day} style={[styles.cell, styles.headerCell]}>
                                <Text style={styles.headerText}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Data Rows */}
                    <ScrollView>
                        {times.map((time, index) => (
                            <View key={time} style={[styles.tableRow, index % 2 === 1 && styles.altRow]}>
                                <View style={[styles.cell, styles.timeCell]}>
                                    <Text style={styles.timeText}>{time}</Text>
                                </View>
                                {days.map(day => {
                                    const entry = grid[time] ? grid[time][day] : null;
                                    return (
                                        <View key={`${time}-${day}`} style={styles.cell}>
                                            {entry ? (
                                                <View style={styles.classCell}>
                                                    <Text style={styles.courseCode}>{entry.course}</Text>
                                                    <Text style={styles.roomText}>{entry.room}</Text>
                                                    <Text style={styles.facultyText}>{entry.faculty}</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.emptyCell}>-</Text>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        );
    };

    // Custom Picker Component
    const SelectionModal = ({ visible, onClose, title, data, onSelect, displayKey = 'name' }) => (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text style={styles.modalItemText}>
                                    {typeof item === 'object' ? item[displayKey] : item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {/* Filters Section */}
            <View style={styles.filtersContainer}>
                <Text style={styles.filterLabel}>Filter Timetable</Text>

                <View style={styles.pickerRow}>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setDeptModalVisible(true)}
                    >
                        <Text style={styles.pickerButtonText}>
                            {selectedDept || 'Select Dept'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.pickerButton, styles.yearPicker]}
                        onPress={() => setYearModalVisible(true)}
                    >
                        <Text style={styles.pickerButtonText}>
                            {selectedYear ? `Year ${selectedYear}` : 'Year'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.pickerButton, { marginTop: 10, backgroundColor: '#fff', borderColor: '#ccc' }]}
                    onPress={() => {
                        if (!selectedDept || !selectedYear) {
                            Alert.alert('Notice', 'Select Dept and Year first');
                            return;
                        }
                        setSectionModalVisible(true);
                    }}
                >
                    <Text style={{
                        color: selectedSection ? '#2c3e50' : '#000000',
                        fontSize: 16,
                        fontWeight: selectedSection ? '500' : 'bold',
                    }}>
                        {selectedSection || 'Select Section'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={fetchTimetable}
                >
                    <Text style={styles.searchButtonText}>View Timetable</Text>
                </TouchableOpacity>
            </View>

            {/* Timetable View */}
            {timetable.times ? (
                renderTable()
            ) : (
                <View style={styles.centerContainer}>
                    {!loading && <Text style={styles.emptyText}>Select filters to view timetable</Text>}
                </View>
            )}

            {/* Modals */}
            <SelectionModal
                visible={deptModalVisible}
                onClose={() => setDeptModalVisible(false)}
                title="Select Department"
                data={departments}
                displayKey="dept_name"
                onSelect={(item) => setSelectedDept(item.dept_name)}
            />

            <SelectionModal
                visible={yearModalVisible}
                onClose={() => setYearModalVisible(false)}
                title="Select Year"
                data={[1, 2, 3, 4]}
                onSelect={(item) => setSelectedYear(item)}
            />

            <SelectionModal
                visible={sectionModalVisible}
                onClose={() => setSectionModalVisible(false)}
                title="Select Section"
                data={sections}
                displayKey="name"
                onSelect={(item) => setSelectedSection(item.name)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    filtersContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
        zIndex: 10,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1e3a8a', // Dark blue
    },
    pickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    pickerButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    yearPicker: {
        flex: 0.4,
    },
    pickerButtonText: {
        color: '#2c3e50',
        fontSize: 14,
        fontWeight: '500',
    },
    placeholderText: {
        color: '#495057',
        fontSize: 14,
    },
    searchButton: {
        backgroundColor: '#3498db',
        padding: 14,
        borderRadius: 8,
        marginTop: 16,
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Table Styles
    tableContainer: {
        flex: 1,
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerRow: {
        backgroundColor: '#34495e',
    },
    altRow: {
        backgroundColor: '#f9f9f9',
    },
    cell: {
        width: 120, // Grid width
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    timeCell: {
        width: 80,
        backgroundColor: '#f0f0f0',
        borderRightWidth: 2,
        borderRightColor: '#ddd',
    },
    headerCell: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    timeText: {
        fontWeight: 'bold',
        color: '#555',
    },
    classCell: {
        alignItems: 'center',
    },
    courseCode: {
        fontWeight: 'bold',
        color: '#2980b9',
        textAlign: 'center',
        fontSize: 13,
        marginBottom: 4,
    },
    roomText: {
        color: '#e67e22',
        fontWeight: '600',
        fontSize: 11,
    },
    facultyText: {
        color: '#7f8c8d',
        fontSize: 10,
        marginTop: 2,
        textAlign: 'center',
    },
    emptyCell: {
        color: '#ddd',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#95a5a6',
        fontSize: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '50%',
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    closeText: {
        fontSize: 24,
        color: '#95a5a6',
        padding: 4,
    },
    modalItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    modalItemText: {
        fontSize: 16,
        color: '#34495e',
    },
});

export default ViewTimetable;
