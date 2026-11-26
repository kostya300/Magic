// frontend/src/components/ForgotPsswordJs/ForgotPassword.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer, Newsletter, Brands } from '../components/componentsforgeneralpage_js';
import '../../styles/components/ForgotPsswordJsScc/ForgotPassword.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            const res = await fetch('/users/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Ошибка отправки письма');
            }

            setSuccess(true);
            setEmail('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="general-page">
            <Header />

            <main className="general-main">
                <div className="general-container">
                    <div className="auth-page">
                        <div className="auth-card">
                            <h2>Сброс пароля</h2>

                            {error && <div className="auth-error">{error}</div>}

                            {success ? (
                                <div className="auth-success">
                                    <p>Письмо для сброса пароля отправлено на ваш email.</p>
                                    <p>Проверьте входящие и следуйте инструкциям из письма.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="auth-form">
                                    <div className="auth-field">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            autoComplete="username"
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="auth-btn" disabled={loading}>
                                        {loading ? 'Отправка...' : 'Отправить'}
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

export default ForgotPassword;
