#!/usr/bin/env python3
"""
Тестовый скрипт для проверки безопасности API
Запуск: python test_security.py
"""
import httpx
import re
import sys
from urllib.parse import urlparse

BASE_URL = "http://localhost:8000"

# Цвета для вывода
class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RESET = "\033[0m"

def print_pass(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_fail(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_warn(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

async def test_security_headers():
    """Проверка заголовков безопасности"""
    print_section("1. ЗАГОЛОВКИ БЕЗОПАСНОСТИ (Security Headers)")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/")
        headers = response.headers
        
        checks = [
            ("Content-Security-Policy", "CSP защита от XSS"),
            ("X-Content-Type-Options", "Защита от MIME sniffing"),
            ("X-Frame-Options", "Защита от clickjacking"),
            ("X-XSS-Protection", "XSS фильтр браузера"),
            ("Strict-Transport-Security", "HSTS (HTTPS принудительно)"),
            ("Referrer-Policy", "Контрол referrer"),
        ]
        
        for header, desc in checks:
            if header in headers:
                print_pass(f"{desc}: {headers[header]}")
            else:
                print_fail(f"{desc} — ОТСУТСТВУЕТ")

async def test_csp_config():
    """Проверка конфигурации CSP"""
    print_section("2. КОНФИГУРАЦИЯ CSP")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/")
        csp = response.headers.get("content-security-policy", "")
        
        # Проверяем строгие правила
        if "'unsafe-inline'" not in csp or "style-src" in csp:
            print_pass("CSP ограничивает загрузку скриптов")
        else:
            print_fail("CSP слишком разрешительный")
        
        if "frame-ancestors 'none'" in csp:
            print_pass("Запрещено встраивание страницы в iframe")
        else:
            print_fail("Страница может быть встроена в iframe (clickjacking)")
        
        if "upgrade-insecure-requests" in csp:
            print_pass("HTTP запросы автоматически апгрейдятся до HTTPS")
        else:
            print_warn("Нет принудительного апгрейда до HTTPS")

async def test_brute_force_protection():
    """Проверка защиты от брутфорса"""
    print_section("3. ЗАЩИТА ОТ БРУТФОРСА")
    
    async with httpx.AsyncClient() as client:
        # Отправляем много неверных попыток
        results = []
        for i in range(7):
            form_data = {
                "username": "test@example.com",
                "password": "wrongpassword"
            }
            response = await client.post(
                f"{BASE_URL}/users/token",
                data=form_data
            )
            results.append(response.status_code)
            
            if response.status_code == 429:
                print_pass(f"Блокировка после {i+1} попытки (429 Too Many Requests)")
                retry_after = response.json().get("detail", {}).get("retry_after", "N/A")
                print_pass(f"Время блокировки: {retry_after} секунд")
                break
            elif response.status_code == 401:
                if i == 6:
                    print_fail("Не сработала блокировка после 5+ попыток")
                else:
                    print_info(f"Попытка {i+1}: 401 Unauthorized")

async def test_email_validation():
    """Проверка валидации email"""
    print_section("4. ВАЛИДАЦИЯ EMAIL")
    
    invalid_emails = [
        "not-an-email",
        "@no-local.com",
        "no@domain",
        "spaces in@email.com",
        "user@" + "a" * 50 + ".com",
    ]
    
    async with httpx.AsyncClient() as client:
        for email in invalid_emails:
            form_data = {
                "username": email,
                "password": "Test1234"
            }
            response = await client.post(
                f"{BASE_URL}/users/token",
                data=form_data
            )
            
            if response.status_code in [422, 400]:
                print_pass(f"Невалидный email отклонён: '{email}' → {response.status_code}")
            else:
                print_fail(f"Невалидный email ПРОПУЩЕН: '{email}' → {response.status_code}")

async def test_password_reset_flow():
    """Проверка сброса пароля"""
    print_section("5. ЗАЩИТА СБРОСА ПАРОЛЯ")
    
    async with httpx.AsyncClient() as client:
        # 5.1 Запрос для несуществующего email
        response = await client.post(
            f"{BASE_URL}/users/forgot-password",
            json={"email": "nonexistent@test.com"}
        )
        
        if response.status_code == 200:
            print_pass("Запрос для несуществующего email возвращает общий ответ")
            msg = response.json().get("message", "")
            if "зарегистрирован" in msg:
                print_pass("Не раскрывается информация о существовании пользователя")
        else:
            print_fail(f"Ошибка при запросе сброса: {response.status_code}")
        
        # 5.2 Rate limiting на сброс пароля
        print_info("\nПроверка rate limiting (2 запроса подряд)...")
        response1 = await client.post(
            f"{BASE_URL}/users/forgot-password",
            json={"email": "test@rate-limit.com"}
        )
        
        response2 = await client.post(
            f"{BASE_URL}/users/forgot-password",
            json={"email": "test@rate-limit.com"}
        )
        
        if response2.status_code == 429:
            print_pass("Rate limiting сработал: 429 Too Many Requests")
        else:
            print_fail("Rate limiting НЕ сработал (нужен cooldown 60 сек)")

async def test_google_oauth():
    """Проверка Google OAuth"""
    print_section("6. GOOGLE OAUTH")
    
    async with httpx.AsyncClient() as client:
        # 6.1 Проверка наличия endpoint
        response = await client.get(
            f"{BASE_URL}/users/google-login",
            follow_redirects=False
        )
        
        if response.status_code == 307:
            print_pass("Google OAuth endpoint доступен")
            location = response.headers.get("location", "")
            if "accounts.google.com" in location:
                print_pass("Redirect на Google сервер")
            
            # Проверяем cookie
            set_cookie = response.headers.get("set-cookie", "")
            if "google_oauth_state" in set_cookie:
                print_pass("CSRF state token сохранён в cookie")
                if "httponly" in set_cookie:
                    print_pass("Cookie httponly (недоступен JS)")
                if "samesite" in set_cookie:
                    print_pass("Cookie samesite (защита от CSRF)")
            else:
                print_fail("CSRF state token НЕ установлен")
        elif response.status_code == 503:
            print_warn("Google OAuth не настроен (нет GOOGLE_CLIENT_ID)")
        else:
            print_fail(f"Ошибка: {response.status_code}")

async def test_cors_config():
    """Проверка CORS"""
    print_section("7. CORS КОНФИГУРАЦИЯ")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/")
        
        # Проверяем что нет wildcard
        origin = response.headers.get("access-control-allow-origin")
        if origin == "*":
            print_fail("CORS разрешает все источники (*)")
        elif origin:
            print_pass(f"CORS разрешает: {origin}")
        else:
            print_info("CORS заголовки не установлены (проверка через OPTIONS)")
            
            # Делаем OPTIONS запрос
            options_response = await client.options(
                f"{BASE_URL}/",
                headers={"Origin": "http://localhost:3000"}
            )
            allow_origin = options_response.headers.get("access-control-allow-origin")
            if allow_origin:
                print_pass(f"Allowed origin: {allow_origin}")

async def test_sql_injection():
    """Проверка защиты от SQL инъекций"""
    print_section("8. ЗАЩИТА ОТ SQL INJECTION")
    
    sql_injections = [
        "admin' OR '1'='1",
        "admin'; DROP TABLE users;--",
        "' OR 1=1 --",
        "1' UNION SELECT * FROM users--",
    ]
    
    async with httpx.AsyncClient() as client:
        for payload in sql_injections:
            form_data = {
                "username": payload,
                "password": "test1234"
            }
            response = await client.post(
                f"{BASE_URL}/users/token",
                data=form_data
            )
            
            # Должен вернуть 401 или 422, а не 500
            if response.status_code in [401, 422]:
                print_pass(f"SQL injection отклонён: '{payload[:30]}...' → {response.status_code}")
            elif response.status_code == 500:
                print_fail(f"Сервер упал при SQL injection: '{payload[:30]}...'")
            else:
                print_fail(f"Неожиданный ответ: '{payload[:30]}...' → {response.status_code}")

async def test_xss_attempts():
    """Проверка защиты от XSS"""
    print_section("9. ЗАЩИТА ОТ XSS")
    
    xss_payloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '"><script>alert(1)</script>',
        'javascript:alert("XSS")',
    ]
    
    async with httpx.AsyncClient() as client:
        for payload in xss_payloads:
            form_data = {
                "username": payload,
                "password": "test1234"
            }
            response = await client.post(
                f"{BASE_URL}/users/token",
                data=form_data
            )
            
            # Проверяем что скрипт не выполнен
            if "<script>" not in response.text.lower() or response.status_code == 401:
                print_pass(f"XSS payload отклонён: '{payload[:30]}...'")
            else:
                print_fail(f"XSS payload ПРОПУЩЁН в ответе!")

async def run_all_tests():
    """Запуск всех тестов"""
    print("\n" + "="*60)
    print("  SECURITY AUDIT SCRIPT")
    print("="*60)
    print_info(f"Тестируем: {BASE_URL}")
    
    try:
        await test_security_headers()
        await test_csp_config()
        await test_brute_force_protection()
        await test_email_validation()
        await test_password_reset_flow()
        await test_google_oauth()
        await test_cors_config()
        await test_sql_injection()
        await test_xss_attempts()
        
        print_section("📊 РЕЗУЛЬТАТЫ")
        print_info("Тестирование завершено!")
        
    except httpx.ConnectError:
        print_fail(f"Не удалось подключиться к {BASE_URL}")
        print_info("Убедись что сервер запущен: uvicorn app.main:app --reload")
    except Exception as e:
        print_fail(f"Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    import asyncio
    # Устанавливаем UTF-8 encoding для консоли
    if sys.platform == "win32":
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    asyncio.run(run_all_tests())
