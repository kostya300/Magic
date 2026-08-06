// frontend/src/pages/Register.js
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header, Footer, Newsletter, Brands } from '../components/componentsforgeneralpage_js';
import '../styles/components/logcomp/LoginPage.css';

function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'buyer'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Ошибка регистрации');
            }

            window.location.replace('/login');
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
                            <h2>Регистрация</h2>

                            {error && <div className="auth-error">{error}</div>}

                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="auth-field">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Почта"
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
                                        placeholder="Минимум 8 символов"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </div>

                                <div className="auth-field">
                                    <label>Подтвердите пароль</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Повторите пароль"
                                        required
                                    />
                                </div>

                                <div className="auth-field">
                                    <label>Роль</label>
                                    <select name="role" value={formData.role} onChange={handleChange}>
                                        <option value="buyer">Покупатель</option>
                                        <option value="seller">Продавец</option>
                                    </select>
                                </div>

                                <button type="submit" className="auth-btn" disabled={loading}>
                                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                                </button>
                            </form>

                            <div className="auth-footer">
                                Уже есть аккаунт? <Link to="/login">Войти</Link>
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

export default Register;
