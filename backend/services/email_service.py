import os
from flask import current_app
from flask_mail import Message
from extensions import mail

def send_email(subject, recipients, body, attachment_path=None):
    """Send email with optional attachment"""
    with current_app.app_context():
        msg = Message(subject, recipients=recipients)
        msg.body = body

        # Attach a file (like timetable CSV)
        if attachment_path:
            with open(attachment_path, "rb") as f:
                msg.attach(
                    filename=os.path.basename(attachment_path),
                    content_type="text/csv",
                    data=f.read()
                )

        mail.send(msg)
        print(f"✅ Email sent to {recipients}")

def send_timetable_notification(faculty_emails, file_path):
    """Send timetable update notification to faculty"""
    try:
        send_email(
            subject="New Timetable Generated",
            recipients=faculty_emails,
            body="Hello,\n\nThe new timetable has been updated successfully. Please check it.\n\nRegards,\nTimetable System",
            attachment_path=file_path
        )
    except Exception as e:
        print(f"⚠️ Failed to send email: {str(e)}")
