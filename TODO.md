# TODO: Implement Timeslot Create/Update Functionality

## Backend Changes
- [ ] Update Timetable model to use `start_time` instead of `slot`
- [ ] Update FacultyUnavailability model to use `start_time`
- [ ] Modify timetable generation algorithm to work with `start_time`
- [ ] Add POST /admin/timetable endpoint for creating timetable entries
- [ ] Add PUT /admin/timetable/<id> endpoint for updating timetable entries
- [ ] Add DELETE /admin/timetable/<id> endpoint for deleting timetable entries
- [ ] Update get_timetable endpoint to return `start_time` instead of `slot`

## Frontend API Changes
- [ ] Add createTimetableEntry method in api.js
- [ ] Add updateTimetableEntry method in api.js
- [ ] Add deleteTimetableEntry method in api.js

## Frontend Component Updates
- [ ] Update ScheduleForm to include all necessary fields (day, start_time, course_id, section_id, faculty_id, room_id)
- [ ] Update timetable.jsx to load timetable data and sections
- [ ] Implement handleSubmit in timetable.jsx to call API for create/update
- [ ] Update TimetableGrid to display scheduled classes and handle editing/deleting

## Testing
- [ ] Test adding a new schedule entry
- [ ] Test editing an existing schedule entry
- [ ] Verify timetable grid displays scheduled classes correctly
- [ ] Check for conflicts and validation
