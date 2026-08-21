import os
from dotenv import load_dotenv
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY")
YOOKASSA_TEST_MODE = os.getenv("YOOKASSA_TEST_MODE", "True") == "True"
YOOKASSA_RETURN_URL = os.getenv("YOOKASSA_RETURN_URL", "http://localhost:8000/")
YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID")