// frontend/src/pages/Login.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setAuthTokens } from '../utils/authUtils';
import { Header, Footer, Newsletter, Brands } from '../components/componentsforgeneralpage_js';
import '../styles/components/logcomp/LoginPage.css';


function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

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
                            <h2>Вход в личный кабинет</h2>

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

                                <div className="auth-field">
                                    <label>Пароль</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Введите пароль"
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>

                                <button type="submit" className="auth-btn" disabled={loading}>
                                    {loading ? 'Вход...' : 'Войти'}
                                </button>
                            </form>

                            <div className="auth-footer">
                                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                            </div>
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
