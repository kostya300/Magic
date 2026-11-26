// frontend/src/pages/Login.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setAuthTokens } from '../utils/authUtils';
import { Header, Footer, Newsletter, Brands } from '../components/componentsforgeneralpage_js';
import PasswordField from '../components/PasswordField';
import '../styles/components/logcomp/LoginPage.css';


function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // Валидация email перед отправкой
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Некорректный email');
            setLoading(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('username', formData.email);
            formDataToSend.append('password', formData.password);

            const res = await fetch('/users/token', {
                method: 'POST',
                body: formDataToSend
            });

            if (!res.ok) {
                const data = await res.json();
                const detail = data.detail;

                if (res.status === 429) {
                    throw new Error(
                        detail?.message ||
                        `Слишком много попыток. Подождите ${detail?.retry_after || 300} сек.`
                    );
                }

                throw new Error(detail || 'Ошибка входа');
            }

            const data = await res.json();
            setAuthTokens(data.access_token, data.refresh_token);

            window.location.replace('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };



    return (
        <div className="general-page">
            <Header />

            <main className="general-main">
                <div className="general-container">
                    <div className="auth-page">
                        <div className="auth-card">
                            <h2>Вход</h2>

                            {error && <div className="auth-error">{error}</div>}

                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="auth-field">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        autoComplete="username"
                                        required
                                    />
                                </div>

                                <PasswordField
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Введите пароль"
                                    autoComplete="current-password"
                                    label="Пароль"
                                    maxLength={128}
                                />

                                <div className="auth-footer auth-footer-link">
                                    <Link to="/forgot-password">Забыли пароль?</Link>
                                </div>

                                <button type="submit" className="auth-btn" disabled={loading}>
                                    {loading ? 'Вход...' : 'Войти'}
                                </button>
                            </form>

                            <div className="auth-footer">
                                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                            </div>

                            <div className="auth-divider">
                                <span>или</span>
                            </div>

                            <button
                                type="button"
                                className="auth-btn auth-btn-google"
                                onClick={() => {
                                    // Переход на backend endpoint (не маршрут React)
                                    // Backend вернёт RedirectResponse на Google OAuth
                                    window.location.href = `${window.location.origin.replace('3000', '8000')}/users/google-login`;
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                    <path fill="none" d="M0 0h48v48H0z"/>
                                </svg>
                                
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer>
                <div className="general-container">
                    <Brands />
                    <Newsletter />
                </div>
                <Footer />
            </footer>
        </div>
    );
}

export default Login;
