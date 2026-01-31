import os

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get("SECRET_KEY", "TimetableSecretKey2025")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = ["http://localhost:5173", "http://localhost:5174"]

    # Mail configuration
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.getenv("MAIL_USER")
    MAIL_PASSWORD = os.getenv("MAIL_PASS")
    MAIL_DEFAULT_SENDER = ("Timetable System", os.getenv("MAIL_USER"))

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'timetable_enhanced.db')}"

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    # Add production database URI here
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///timetable_enhanced.db")

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
