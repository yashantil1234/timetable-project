"""
Test email configuration for the Timetable Management System
Run this to verify your Gmail App Password is configured correctly
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from flask_mail import Mail, Message
from app import create_app

def test_email():
    """Test email sending functionality"""
    app = create_app()
    mail = Mail(app)
    
    print("=" * 60)
    print("Email Configuration Test")
    print("=" * 60)
    
    # Display current configuration (without showing password)
    print(f"\n📧 Email Settings:")
    print(f"   Server: {app.config.get('MAIL_SERVER')}")
    print(f"   Port: {app.config.get('MAIL_PORT')}")
    print(f"   TLS: {app.config.get('MAIL_USE_TLS')}")
    print(f"   Username: {app.config.get('MAIL_USERNAME')}")
    print(f"   Password: {'*' * 16 if app.config.get('MAIL_PASSWORD') else 'NOT SET'}")
    
    if not app.config.get('MAIL_USERNAME') or not app.config.get('MAIL_PASSWORD'):
        print("\n❌ Error: MAIL_USER or MAIL_PASS not configured!")
        print("   Please set these in your .env file:")
        print("   MAIL_USER=your-email@gmail.com")
        print("   MAIL_PASS=your-app-password")
        return
    
    # Get recipient email
    recipient = input("\n📨 Enter recipient email (press Enter to use sender): ").strip()
    if not recipient:
        recipient = app.config.get('MAIL_USERNAME')
    
    print(f"\n📤 Sending test email to: {recipient}")
    
    with app.app_context():
        msg = Message(
            subject="✅ Timetable System - Email Test Successful",
            recipients=[recipient],
            body="""
Hello!

This is a test email from your Timetable Management System.

If you're reading this, your email configuration is working correctly! 🎉

Configuration Details:
- SMTP Server: smtp.gmail.com
- Port: 587
- TLS: Enabled
- Authentication: App Password

You can now use email features like:
- Leave request notifications
- Swap request alerts
- System announcements
- Password reset emails

Best regards,
Timetable Management System
            """,
            html="""
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #3498db;">✅ Email Test Successful!</h2>
        
        <p>Hello!</p>
        
        <p>This is a test email from your <strong>Timetable Management System</strong>.</p>
        
        <p>If you're reading this, your email configuration is working correctly! 🎉</p>
        
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Configuration Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li>📧 SMTP Server: smtp.gmail.com</li>
                <li>🔌 Port: 587</li>
                <li>🔒 TLS: Enabled</li>
                <li>🔑 Authentication: App Password</li>
            </ul>
        </div>
        
        <h3 style="color: #2c3e50;">You can now use email features like:</h3>
        <ul>
            <li>Leave request notifications</li>
            <li>Swap request alerts</li>
            <li>System announcements</li>
            <li>Password reset emails</li>
        </ul>
        
        <p style="margin-top: 30px; color: #7f8c8d;">
            Best regards,<br>
            <strong>Timetable Management System</strong>
        </p>
    </div>
</body>
</html>
            """
        )
        
        try:
            mail.send(msg)
            print("\n✅ SUCCESS! Email sent successfully!")
            print(f"   Check your inbox at: {recipient}")
            print("\n💡 If you don't see it, check your spam folder.")
            
        except Exception as e:
            print(f"\n❌ ERROR: Failed to send email")
            print(f"   Error message: {str(e)}")
            print("\n🔧 Troubleshooting:")
            print("   1. Check your MAIL_USER is correct")
            print("   2. Verify MAIL_PASS is your App Password (not regular password)")
            print("   3. Ensure App Password has no spaces")
            print("   4. Confirm 2-Step Verification is enabled on Gmail")
            print("   5. Try generating a new App Password")

if __name__ == "__main__":
    test_email()
