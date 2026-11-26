# app/services/email_service.py
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, FRONTEND_URL
from loguru import logger


async def send_reset_password_email(to_email: str, reset_token: str) -> bool:
    """
    Отправляет email с ссылкой для сброса пароля через Gmail SMTP.
    """
    reset_link = f"{FRONTEND_URL}/reset-password/{reset_token}"
    
    subject = "Сброс пароля - MrStore"
    html_body = f"""
    <html>
    <body>
        <h2>Сброс пароля</h2>
        <p>Вы запросили сброс пароля. Нажмите на ссылку ниже, чтобы создать новый пароль:</p>
        <p>
            <a href="{reset_link}" 
               style="display: inline-block; padding: 12px 24px; background-color: #4f8ef7; 
                      color: white; text-decoration: none; border-radius: 8px;">
                Сбросить пароль
            </a>
        </p>
        <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
        <p>Ссылка действительна в течение 1 часа.</p>
    </body>
    </html>
    """
    
    message = MIMEMultipart()
    message["From"] = SMTP_USERNAME
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(html_body, "html"))
    
    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        logger.info(f"Письмо для сброса пароля отправлено на {to_email}")
        return True
    except Exception as e:
        logger.error(f"Ошибка отправки email на {to_email}: {e}")
        return False
