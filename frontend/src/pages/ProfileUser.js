// frontend/src/pages/ProfileUser.js
import { useState, useEffect } from 'react';
import { authFetch, isAuthenticated, clearAuthTokens } from '../utils/authUtils';
import '../styles/components/ProfileUserPageComponentsStyle/ProfileUser.css';

function ProfileUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    city: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!isAuthenticated()) {
          setError('Необходимо авторизоваться');
          setLoading(false);
          return;
        }

        const res = await authFetch('/users/me');
        if (res.status === 401) {
          clearAuthTokens();
          setError('Сессия истекла');
          setLoading(false);
          window.location.replace('/login');
          return;
        }
        if (!res.ok) throw new Error('Ошибка загрузки профиля');
        const data = await res.json();
        setUser(data);
        setFormData({
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const res = await authFetch('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditing(false);
        window.location.reload();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.detail || 'Ошибка при обновлении');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Ошибка при обновлении профиля');
    }
  };

  if (loading) return <div className="profile-user-page">Загрузка...</div>;
  if (error) return (
    <div className="profile-user-page">
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
        <button
          onClick={() => window.location.replace('/login')}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#4f8ef7',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Войти
        </button>
      </div>
    </div>
  );

  return (
    <div className="profile-user-page">
      <div className="profile-user-header">
        <h1 className="profile-user-title">Мой профиль</h1>
        <p className="profile-user-subtitle">Управляйте своей личной информацией</p>
      </div>

      <div className="profile-user-card">
        <div className="profile-user-avatar-section">
          <div className="profile-user-avatar">
            <span>{user?.email?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <h2 className="profile-user-name">{user?.email?.split('@')[0] || 'Пользователь'}</h2>
          <p className="profile-user-email">{user?.email}</p>
        </div>

        <div className="profile-user-info">
          <div className="profile-user-info-item">
            <label className="profile-user-info-label">Email</label>
            {editing ? (
              <input
                className="profile-user-input"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            ) : (
              <p className="profile-user-info-value">{user?.email}</p>
            )}
          </div>

          <div className="profile-user-info-item">
            <label className="profile-user-info-label">Телефон</label>
            {editing ? (
              <input
                className="profile-user-input"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (999) 123-45-67"
              />
            ) : (
              <p className="profile-user-info-value">{user?.phone || 'Не указан'}</p>
            )}
          </div>

          <div className="profile-user-info-item">
            <label className="profile-user-info-label">Город</label>
            {editing ? (
              <input
                className="profile-user-input"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Москва"
              />
            ) : (
              <p className="profile-user-info-value">{user?.city || 'Не указан'}</p>
            )}
          </div>

          <div className="profile-user-info-item">
            <label className="profile-user-info-label">Дата регистрации</label>
            <p className="profile-user-info-value">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : 'Неизвестно'}
            </p>
          </div>
        </div>

        <div className="profile-user-actions">
          {editing ? (
            <>
              <button className="profile-user-btn profile-user-btn-save" onClick={handleSave}>
                Сохранить
              </button>
              <button className="profile-user-btn profile-user-btn-cancel" onClick={() => setEditing(false)}>
                Отмена
              </button>
            </>
          ) : (
            <button className="profile-user-btn profile-user-btn-edit" onClick={() => setEditing(true)}>
              Редактировать
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileUser;
