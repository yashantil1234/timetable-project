"""
Simple standalone email test - bypasses Flask app caching
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Read directly from .env file
with open('.env', 'r') as f:
    env_lines = f.readlines()
    
env_vars = {}
for line in env_lines:
    if '=' in line and not line.startswith('#'):
        key, value = line.strip().split('=', 1)
        env_vars[key] = value

print("=" * 60)
print("Standalone Email Test")
print("=" * 60)
print(f"\nMAIL_USER: {env_vars.get('MAIL_USER', 'NOT SET')}")
print(f"MAIL_PASS: {'*' * 16 if env_vars.get('MAIL_PASS') else 'NOT SET'}")
print(f"MAIL_PASS length: {len(env_vars.get('MAIL_PASS', ''))}")
print(f"MAIL_PASS actual: {env_vars.get('MAIL_PASS', 'NOT SET')}")

recipient = input("\n📨 Enter recipient email (press Enter to use sender): ").strip()
if not recipient:
    recipient = env_vars.get('MAIL_USER')

print(f"\n📤 Sending test email to: {recipient}")

try:
    # Create message
    msg = MIMEMultipart()
    msg['From'] = env_vars.get('MAIL_USER')
    msg['To'] = recipient
    msg['Subject'] = "✅ Email Test Successful - Timetable System"
    
    body = "Congratulations! Your email configuration is working correctly!"
    msg.attach(MIMEText(body, 'plain'))
    
    # Connect to Gmail SMTP
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.set_debuglevel(1)  # Show debug output
    server.starttls()
    
    # Login
    server.login(env_vars.get('MAIL_USER'), env_vars.get('MAIL_PASS'))
    
    # Send email
    server.send_message(msg)
    server.quit()
    
    print("\n✅ SUCCESS! Email sent successfully!")
    print(f"   Check your inbox at: {recipient}")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\n🔧 Troubleshooting:")
    print("   1. Verify the App Password is correct")
    print("   2. Check .env file has no spaces in password")
    print("   3. Ensure 2-Step Verification is enabled")
