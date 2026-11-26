// frontend/src/components/ForgotPsswordJs/ResetPassword.js
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header, Footer, Newsletter, Brands } from '../componentsforgeneralpage_js';
import PasswordField from '../PasswordField';
import '../../styles/components/ForgotPsswordJsScc/ForgotPassword.css';

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({ 
        password: '', 
        confirmPassword: '' 
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Валидация на клиенте
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (formData.password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов');
            return;
        }

        if (!/[A-Z]/.test(formData.password)) {
            setError('Пароль должен содержать хотя бы одну заглавную букву');
            return;
        }

        if (!/[a-z]/.test(formData.password)) {
            setError('Пароль должен содержать хотя бы одну строчную букву');
            return;
        }

        if (!/\d/.test(formData.password)) {
            setError('Пароль должен содержать хотя бы одну цифру');
            return;
        }

        setSuccess(false);
        setLoading(true);

        try {
            const res = await fetch('/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    new_password: formData.password
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Ошибка сброса пароля');
            }

            setSuccess(true);
            
            // Перенаправление на страницу входа через 3 секунды
            setTimeout(() => {
                navigate('/login');
            }, 3000);
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
                            <h2>Новый пароль</h2>

                            {error && <div className="auth-error">{error}</div>}

                            {success ? (
                                <div className="auth-success">
                                    <p>Пароль успешно изменён!</p>
                                    <p>Перенаправление на страницу входа...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="auth-form">
                                    <PasswordField
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Введите новый пароль"
                                        autoComplete="new-password"
                                        minLength={8}
                                        label="Новый пароль"
                                    />

                                    <PasswordField
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Повторите пароль"
                                        autoComplete="new-password"
                                        label="Подтвердите пароль"
                                    />

                                    <button type="submit" className="auth-btn" disabled={loading}>
                                        {loading ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </form>
                            )}

                            <div className="auth-footer">
                                <Link to="/login">← Вернуться ко входу</Link>
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

export default ResetPassword;
