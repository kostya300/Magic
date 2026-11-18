// frontend/src/components/componentsforprofilepage/ProfileCard.js
import { useState, useEffect, useRef } from 'react';
import { authFetch, isAuthenticated, clearAuthTokens } from '../../utils/authUtils';
import '../../styles/components/profilecss/ProfileCard.css';

function ProfileCard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!isAuthenticated()) {
          setLoading(false);
          return;
        }

        const res = await authFetch('/users/me');
        if (res.status === 401) {
          clearAuthTokens();
          setLoading(false);
          window.location.replace('/login');
          return;
        }
        if (!res.ok) throw new Error('Ошибка загрузки профиля');
        const data = await res.json();
        setUser(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          city: data.city || '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await authFetch('/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        setEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.detail || 'Ошибка при обновлении');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Ошибка при обновлении профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Валидация на фронтенде
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    setUploadError('');

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Разрешены только изображения: jpg, png, webp');
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setUploadError('Разрешены только изображения: jpg, png, webp');
      return;
    }

    if (file.size > maxSize) {
      setUploadError('Изображение слишком большое (макс. 2MB)');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await authFetch('/users/me/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setUploadError(errorData.detail || 'Ошибка при загрузке');
      }
    } catch (err) {
      setUploadError('Не удалось загрузить аватарку');
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="profile-card-section">Загрузка...</div>;
  if (!user) return null;

  const info = [
    {
      label: 'Имя',
      key: 'name',
      value: user.name || 'Не указано',
    },
    { label: 'Email', value: user.email },
    {
      label: 'Телефон',
      key: 'phone',
      value: user.phone || 'Не указан',
    },
    {
      label: 'Город',
      key: 'city',
      value: user.city || 'Не указан',
    },
    {
      label: 'Дата регистрации',
      value: user.created_at
        ? new Date(user.created_at).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : 'Неизвестно',
    },
    {
      label: 'Уровень',
      value: 'Платиновый',
    },
  ];

  const avatarSrc = user.avatar_url
    ? `${user.avatar_url}${user.avatar_url.startsWith('/') ? '' : ''}`
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face';

  return (
    <div className="profile-card-section">
      <div className="profile-card-header">
        <h2 className="profile-card-section-title">Профиль</h2>
        {!editing && (
          <button
            className="profile-card-edit-btn"
            onClick={() => setEditing(true)}
          >
            Редактировать
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="profile-card-success">
          Профиль успешно обновлён
        </div>
      )}

      {uploadError && (
        <div className="profile-card-upload-error">
          {uploadError}
        </div>
      )}

      <div className="profile-card-body">
        <div className="profile-card-avatar-wrapper">
          <img
            src={avatarSrc}
            alt="Фото профиля"
            className="profile-card-avatar"
          />
          <label
            className="profile-card-avatar-edit"
            title="Изменить фото"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          {uploading && (
            <div className="profile-card-avatar-loading">...</div>
          )}
        </div>
        <div className="profile-card-info">
          {info.map(({ label, key, value }) => (
            <div key={label} className="profile-info-item">
              <p className="profile-info-label">{label}</p>
              <p className="profile-info-value">
                {editing && key && formData[key] !== undefined ? (
                  <input
                    className="profile-card-input"
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
                  value
                )}
              </p>
            </div>
          ))}
        </div>

        {editing && (
          <div className="profile-card-actions">
            <button
              className="profile-card-btn profile-card-btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              className="profile-card-btn profile-card-btn-cancel"
              onClick={() => {
                setEditing(false);
                setFormData({
                  name: user.name || '',
                  phone: user.phone || '',
                  city: user.city || '',
                });
              }}
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileCard;
