import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, clearAuthTokens } from '../../utils/authUtils';
import '../../styles/components/logcomp/AuthLink.css';

export default function AuthLink({ className = '' }) {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();

  const handleLogout = () => {
    clearAuthTokens();
    navigate('/');
  };

  if (loggedIn) {
    return (
      <button onClick={handleLogout} className={`auth-link auth-link-logout ${className}`}>
        Выйти
      </button>
    );
  }

  return (
    <div className={`auth-links-group ${className}`}>
      <Link to="/login" className="auth-link">Вход</Link>
      <Link to="/register" className="auth-link auth-link-outline">Регистрация</Link>
    </div>
  );
}
