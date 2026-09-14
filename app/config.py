import os
from dotenv import load_dotenv
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY")
YOOKASSA_TEST_MODE = os.getenv("YOOKASSA_TEST_MODE", "True") == "True"
YOOKASSA_RETURN_URL = os.getenv("YOOKASSA_RETURN_URL", "http://localhost:8000/")
YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@mrstore.ru")