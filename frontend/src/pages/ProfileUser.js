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
    name: '',
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
          name: data.name || '',
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setEditing(false);
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

  const infoFields = [
    { label: 'Имя', key: 'name', editable: !editing },
    { label: 'Email', key: 'email', editable: false },
    { label: 'Телефон', key: 'phone', editable: !editing },
    { label: 'Город', key: 'city', editable: !editing },
    {
      label: 'Дата регистрации',
      key: 'created_at',
      editable: false,
      value: user?.created_at
        ? new Date(user.created_at).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : 'Неизвестно',
    },
    { label: 'Уровень', key: 'level', editable: false, value: 'Платиновый' },
  ];

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
          <h2 className="profile-user-name">
            {user?.name || user?.email?.split('@')[0] || 'Пользователь'}
          </h2>
          <p className="profile-user-email">{user?.email}</p>
        </div>

        <div className="profile-user-info">
          {infoFields.map(({ label, key, editable, value: staticValue }) => (
            <div key={label} className="profile-user-info-item">
              <label className="profile-user-info-label">{label}</label>
              {editing && editable ? (
                <input
                  className="profile-user-input"
                  value={formData[key]}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={
                    key === 'name'
                      ? 'Введите имя'
                      : key === 'phone'
                      ? '+7 (999) 123-45-67'
                      : 'Введите город'
                  }
                />
              ) : (
                <p className="profile-user-info-value">
                  {staticValue || user?.[key] || 'Не указан'}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="profile-user-actions">
          {editing ? (
            <>
              <button
                className="profile-user-btn profile-user-btn-save"
                onClick={handleSave}
              >
                Сохранить
              </button>
              <button
                className="profile-user-btn profile-user-btn-cancel"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    city: user.city || '',
                  });
                }}
              >
                Отмена
              </button>
            </>
          ) : (
            <button
              className="profile-user-btn profile-user-btn-edit"
              onClick={() => setEditing(true)}
            >
              Редактировать
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileUser;
