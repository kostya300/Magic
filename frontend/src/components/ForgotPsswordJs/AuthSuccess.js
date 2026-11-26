// frontend/src/components/ForgotPsswordJs/AuthSuccess.js
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { setAuthTokens } from '../../utils/authUtils';

function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');

        if (error) {
            navigate('/login', { state: { error: 'Ошибка входа через Google' } });
            return;
        }

        if (accessToken && refreshToken) {
            // Сохраняем токены в localStorage
            setAuthTokens(accessToken, refreshToken);
            
            // Очищаем URL от токенов (чтобы не оставались в истории)
            const url = new URL(window.location.href);
            url.searchParams.delete('access_token');
            url.searchParams.delete('refresh_token');
            window.history.replaceState({}, '', url.toString());
            
            // Перенаправляем на главную через секунду
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            flexDirection: 'column',
            gap: '16px'
        }}>
            <div style={{
                fontSize: '48px',
                animation: 'spin 1s linear infinite'
            }}>⏳</div>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
                Входим через Google...
            </p>
        </div>
    );
}

export default AuthSuccess;
