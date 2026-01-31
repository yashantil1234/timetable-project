"""
Utility functions for chatbot operations
"""

from datetime import datetime
from flask import jsonify
from sqlalchemy import or_
from extensions import db
from models import (
    Timetable, Faculty, Classroom, LeaveRequest,
    SystemAnnouncement, SwapRequest, ChatbotConversation
)

# Enhanced Intent Recognition for SIH
INTENTS = {
    "timetable": ["timetable", "schedule", "classes", "my classes", "my schedule"],
    "next_class": ["next class", "upcoming", "when is my", "what's next", "next lecture"],
    "free_rooms": ["free rooms", "available rooms", "empty rooms", "vacant", "room availability"],
    "faculty_load": ["faculty load", "teacher workload", "teaching hours", "faculty stats"],
    "room_utilization": ["room usage", "room utilization", "room stats", "room occupancy"],
    "leave_status": ["leave status", "my leave", "leave requests", "absence"],
    "announcements": ["announcements", "notices", "updates", "news"],
    "help": ["help", "what can you do", "commands", "assist", "guide"],
    "swap_request": ["swap", "exchange", "substitute", "replace class"],
    "room_booking": ["book room", "reserve room", "room booking", "room reservation"]
}


def detect_intent(query: str) -> str:
    """Enhanced intent detection with SIH-specific keywords"""
    query = query.lower().strip()
    
    # Check for exact matches first
    for intent, keywords in INTENTS.items():
        if any(f" {kw} " in f" {query} " for kw in keywords):
            return intent
    
    # Check for partial matches
    for intent, keywords in INTENTS.items():
        if any(kw in query for kw in keywords):
            return intent
    
    return "unknown"


def save_conversation(user_id: int, query: str, response: str, intent: str, response_type: str = "text"):
    """Save conversation to database"""
    try:
        conversation = ChatbotConversation(
            user_id=user_id,
            query=query,
            response=response,
            intent=intent,
            response_type=response_type
        )
        db.session.add(conversation)
        db.session.commit()
    except Exception as e:
        print(f"Error saving conversation: {e}")


def get_user_timetable_chatbot(current_user):
    """Enhanced timetable retrieval for chatbot"""
    try:
        if current_user.role == "student":
            if not current_user.section_id:
                return jsonify({
                    "success": False,
                    "response": "❌ You're not assigned to a section. Please contact the administrator.",
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            entries = Timetable.query.filter_by(section_id=current_user.section_id).all()
            if not entries:
                return jsonify({
                    "success": True,
                    "response": "📅 No timetable found for your section. Please contact the administrator.",
                    "type": "info",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Enhanced formatting
            schedule = {}
            for entry in entries:
                day = entry.day
                if day not in schedule:
                    schedule[day] = []
                schedule[day].append({
                    "time": f"{entry.start_time}:00",
                    "course": entry.course.name,
                    "room": entry.room.name,
                    "faculty": entry.faculty.faculty_name,
                })
            
            # Sort by time
            for day in schedule:
                schedule[day].sort(key=lambda x: x["time"])
            
            response = f"📅 **Your Timetable - {current_user.section.name} (Year {current_user.year})**\n\n"
            for day, classes in schedule.items():
                response += f"**{day}:**\n"
                for cls in classes:
                    response += f"🕐 {cls['time']} - **{cls['course']}**\n"
                    response += f"   📍 {cls['room']} | 👨‍🏫 {cls['faculty']}\n\n"
            
            return jsonify({
                "success": True,
                "response": response,
                "type": "timetable",
                "data": schedule,
                "timestamp": datetime.utcnow().isoformat()
            })

        elif current_user.role == "teacher":
            faculty = Faculty.query.filter_by(
                faculty_name=current_user.full_name, 
                dept_id=current_user.dept_id
            ).first()
            
            if not faculty:
                return jsonify({
                    "success": False,
                    "response": "❌ Faculty record not found. Please contact the administrator.",
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            entries = Timetable.query.filter_by(faculty_id=faculty.faculty_id).all()
            if not entries:
                return jsonify({
                    "success": True,
                    "response": "📅 You have no classes scheduled.",
                    "type": "info",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            response = f"👨‍🏫 **Your Teaching Schedule** ({len(entries)} classes)\n\n"
            for entry in entries:
                response += f"🕐 **{entry.day} {entry.start_time}:00**\n"
                response += f"📚 {entry.course.name}\n"
                response += f"👥 Section {entry.section.name}, Year {entry.section.year}\n"
                response += f"📍 {entry.room.name}\n\n"
            
            return jsonify({
                "success": True,
                "response": response,
                "type": "timetable",
                "timestamp": datetime.utcnow().isoformat()
            })

        else:
            return jsonify({
                "success": False,
                "response": "ℹ️ Administrators don't have personal timetables.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error retrieving timetable: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })


def get_next_class_chatbot(current_user):
    """Enhanced next class finder"""
    try:
        now = datetime.now()
        current_day = now.strftime("%a")
        current_hour = now.hour
        
        if current_user.role == "student":
            entries = Timetable.query.filter_by(section_id=current_user.section_id).all()
        elif current_user.role == "teacher":
            faculty = Faculty.query.filter_by(
                faculty_name=current_user.full_name,
                dept_id=current_user.dept_id
            ).first()
            if not faculty:
                return jsonify({
                    "success": False,
                    "response": "❌ Faculty record not found.",
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat()
                })
            entries = Timetable.query.filter_by(faculty_id=faculty.faculty_id).all()
        else:
            return jsonify({
                "success": False,
                "response": "ℹ️ Next class feature not available for administrators.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })

        if not entries:
            return jsonify({
                "success": True,
                "response": "📅 No classes found in your schedule.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })

        # Find next class
        days_order = ["Mon", "Tue", "Wed", "Thu", "Fri"]
        current_day_idx = days_order.index(current_day) if current_day in days_order else 0
        
        # Look for classes today after current time
        today_classes = [e for e in entries if e.day == current_day and int(e.start_time) > current_hour]
        if today_classes:
            next_class = min(today_classes, key=lambda x: int(x.start_time))
            time_diff = int(next_class.start_time) - current_hour
            response = f"⏰ **Your Next Class:**\n\n"
            response += f"📚 **{next_class.course.name}**\n"
            response += f"🕐 **{next_class.start_time}:00** (in {time_diff} hour(s))\n"
            response += f"📍 **{next_class.room.name}**\n"
            response += f"👨‍🏫 **{next_class.faculty.faculty_name}**"
            
            return jsonify({
                "success": True,
                "response": response,
                "type": "next_class",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Look for classes in upcoming days
        for i in range(1, 6):
            day_idx = (current_day_idx + i) % 5
            day = days_order[day_idx]
            day_classes = [e for e in entries if e.day == day]
            if day_classes:
                next_class = min(day_classes, key=lambda x: int(x.start_time))
                response = f"⏰ **Your Next Class:**\n\n"
                response += f"📚 **{next_class.course.name}**\n"
                response += f"📅 **{day} at {next_class.start_time}:00**\n"
                response += f"📍 **{next_class.room.name}**\n"
                response += f"👨‍🏫 **{next_class.faculty.faculty_name}**"
                
                return jsonify({
                    "success": True,
                    "response": response,
                    "type": "next_class",
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        return jsonify({
            "success": True,
            "response": "📅 No upcoming classes found this week.",
            "type": "info",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error finding next class: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })


def get_free_rooms_chatbot(current_user):
    """Enhanced free rooms checker"""
    try:
        now = datetime.now()
        current_day = now.strftime("%a")
        current_hour = now.hour
        
        # Find current slot
        time_slots = ["09", "11", "01", "03"]
        current_slot = None
        for slot in time_slots:
            slot_hour = int(slot) if int(slot) > 8 else int(slot) + 12
            if current_hour >= slot_hour and current_hour < slot_hour + 1:
                current_slot = slot
                break
        
        if not current_slot:
            return jsonify({
                "success": True,
                "response": "ℹ️ No classes are currently running.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Find occupied rooms
        occupied_rooms = db.session.query(Timetable.room_id)\
            .filter_by(day=current_day, start_time=current_slot)\
            .distinct().all()
        occupied_room_ids = [room[0] for room in occupied_rooms]
        
        # Find free rooms
        all_rooms = Classroom.query.all()
        free_rooms = [room for room in all_rooms if room.room_id not in occupied_room_ids]
        
        if not free_rooms:
            return jsonify({
                "success": True,
                "response": "🏫 All rooms are currently occupied.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = f"🏫 **Free Rooms Right Now** ({current_day} {current_slot}:00)\n\n"
        for room in free_rooms:
            response += f"📍 **{room.name}**\n"
            response += f"   👥 Capacity: {room.capacity}\n"
            if room.resources:
                response += f"   🔧 Resources: {room.resources}\n"
            response += "\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "free_rooms",
            "data": [{"name": r.name, "capacity": r.capacity, "resources": r.resources} for r in free_rooms],
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error checking free rooms: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })


def get_faculty_load_chatbot():
    """Enhanced faculty workload checker"""
    try:
        faculty_list = Faculty.query.all()
        if not faculty_list:
            return jsonify({
                "success": True,
                "response": "ℹ️ No faculty found in the system.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "👨‍🏫 **Faculty Workload Summary**\n\n"
        total_hours = 0
        
        for faculty in faculty_list:
            class_count = Timetable.query.filter_by(faculty_id=faculty.faculty_id).count()
            utilization = (class_count / faculty.max_hours) * 100 if faculty.max_hours > 0 else 0
            
            status_emoji = "🟢" if utilization < 80 else "🟡" if utilization < 100 else "🔴"
            response += f"{status_emoji} **{faculty.faculty_name}**\n"
            response += f"   📊 {class_count}/{faculty.max_hours} hours ({utilization:.1f}%)\n"
            if faculty.department:
                response += f"   🏢 {faculty.department.dept_name}\n\n"
            total_hours += class_count
        
        response += f"📈 **Total Classes Assigned: {total_hours}**"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "faculty_load",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting faculty load: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })


def get_room_utilization_chatbot():
    """Enhanced room utilization checker"""
    try:
        rooms = Classroom.query.all()
        if not rooms:
            return jsonify({
                "success": True,
                "response": "ℹ️ No rooms found in the system.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "🏫 **Room Utilization Report**\n\n"
        total_slots = 20  # 4 slots × 5 days
        
        for room in rooms:
            allocations = Timetable.query.filter_by(room_id=room.room_id).count()
            utilization = (allocations / total_slots) * 100
            
            status_emoji = "🟢" if utilization < 50 else "🟡" if utilization < 80 else "🔴"
            response += f"{status_emoji} **{room.name}**\n"
            response += f"   📊 {allocations}/{total_slots} slots ({utilization:.1f}%)\n"
            response += f"   👥 Capacity: {room.capacity}\n"
            if room.resources:
                response += f"   🔧 Resources: {room.resources}\n"
            response += "\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "room_utilization",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting room utilization: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })


def get_leave_status_chatbot(current_user):
    """Get leave status for chatbot"""
    try:
        if current_user.role not in ["teacher", "student"]:
            return jsonify({
                "success": False,
                "response": "ℹ️ Leave status is only available for teachers and students.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        requests = LeaveRequest.query.filter_by(user_id=current_user.id)\
            .order_by(LeaveRequest.created_at.desc()).limit(5).all()
        
        if not requests:
            return jsonify({
                "success": True,
                "response": "📅 No leave requests found.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "📅 **Your Recent Leave Requests**\n\n"
        for req in requests:
            status_emoji = {"pending": "⏳", "approved": "✅", "rejected": "❌", "cancelled": "🚫"}.get(req.status, "❓")
            response += f"{status_emoji} **{req.leave_type.title()} Leave**\n"
            response += f"   📅 {req.start_date} to {req.end_date}\n"
            response += f"   📝 {req.reason[:50]}{'...' if len(req.reason) > 50 else ''}\n"
            response += f"   🏷️ Status: {req.status.title()}\n\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "leave_status",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting leave status: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })


def get_announcements_chatbot(current_user):
    """Get system announcements for chatbot"""
    try:
        # Get active announcements for user's role
        announcements = SystemAnnouncement.query.filter(
            SystemAnnouncement.is_active == True,
            or_(
                SystemAnnouncement.target_roles.is_(None),
                SystemAnnouncement.target_roles.contains(current_user.role)
            ),
            or_(
                SystemAnnouncement.expires_at.is_(None),
                SystemAnnouncement.expires_at > datetime.utcnow()
            )
        ).order_by(SystemAnnouncement.created_at.desc()).limit(5).all()
        
        if not announcements:
            return jsonify({
                "success": True,
                "response": "📢 No announcements at the moment.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "📢 **Latest Announcements**\n\n"
        for ann in announcements:
            priority_emoji = {"low": "🔵", "normal": "🟡", "high": "🟠", "urgent": "🔴"}.get(ann.priority, "🟡")
            response += f"{priority_emoji} **{ann.title}**\n"
            response += f"   📝 {ann.message}\n"
            response += f"   📅 {ann.created_at.strftime('%Y-%m-%d %H:%M')}\n\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "announcements",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting announcements: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })


def get_swap_requests_chatbot(current_user):
    """Get swap requests for chatbot"""
    try:
        if current_user.role != "teacher":
            return jsonify({
                "success": False,
                "response": "ℹ️ Swap requests are only available for teachers.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        faculty = Faculty.query.filter_by(
            faculty_name=current_user.full_name,
            dept_id=current_user.dept_id
        ).first()
        
        if not faculty:
            return jsonify({
                "success": False,
                "response": "❌ Faculty record not found.",
                "type": "error",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Get requests for this faculty
        requests = SwapRequest.query.filter_by(
            requesting_faculty_id=faculty.faculty_id
        ).order_by(SwapRequest.created_at.desc()).limit(5).all()
        
        if not requests:
            return jsonify({
                "success": True,
                "response": "🔄 No swap requests found.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "🔄 **Your Swap Requests**\n\n"
        for req in requests:
            status_emoji = {"pending": "⏳", "approved": "✅", "rejected": "❌", "cancelled": "🚫"}.get(req.status, "❓")
            response += f"{status_emoji} **Swap Request**\n"
            response += f"   📅 {req.proposed_day} {req.proposed_start_time}\n"
            response += f"   🏷️ Status: {req.status.title()}\n\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "swap_requests",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting swap requests: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })
