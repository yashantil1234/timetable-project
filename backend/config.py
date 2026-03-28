import os

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get("SECRET_KEY", "TimetableSecretKey2025")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS configuration - support environment variable for production
    cors_origins_env = os.environ.get("CORS_ORIGINS", "")
    if cors_origins_env:
        CORS_ORIGINS = [origin.strip() for origin in cors_origins_env.split(",")]
    else:
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
    # Production database - use DATABASE_URL from environment
    # Handle both postgres:// and postgresql:// schemes (Heroku uses postgres://)
    database_url = os.environ.get("DATABASE_URL")
    
    if not database_url:
        # Fallback to sqlite if DATABASE_URL is missing
        SQLALCHEMY_DATABASE_URI = "sqlite:///timetable_enhanced_prod.db"
    else:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = database_url

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
