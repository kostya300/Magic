from app.main import celery

@celery.task
def send_email_verification(email, host):
    """Отправка email подтверждения (заглушка)"""
    print(f"Sending verification email to {email} on {host}")
    return True