// frontend/src/components/componentsforprofilepage/ProfileSidebar.js
import '../../styles/components/profilecss/SidebarProfile.css';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { id: 'dashboard', icon: '📊', label: 'Обзор' },
  { id: 'profile', icon: '👤', label: 'Профиль' },
  { id: 'orders', icon: '📦', label: 'Заказы' },
  { id: 'messages', icon: '💬', label: 'Сообщения', badge: 3 },
  { id: 'security', icon: '🔒', label: 'Безопасность' },
  { id: 'billing', icon: '💳', label: 'Платежи' },
  { id: 'settings', icon: '⚙️', label: 'Настройки' },
];

function ProfileSidebar({ activeSection, onSectionChange, isOpen, onToggle }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <>
      <aside className={`profile-sidebar${isOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="profile-logo">
          <div className="profile-logo-inner">
            <div className="profile-logo-icon">
              <span>ЛК</span>
            </div>
            <span className="profile-logo-text">Личный кабинет</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="profile-nav">
          <p className="profile-nav-label">Навигация</p>
          <ul className="profile-nav-list">
            {navItems.map(item => (
              <li key={item.id} className="profile-nav-item">
                <button
                  className={`profile-nav-btn${activeSection === item.id ? ' active' : ''}`}
                  onClick={() => {
                    onSectionChange(item.id);
                    onToggle();
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label-text">{item.label}</span>
                  {item.badge && <span className="profile-nav-badge">{item.badge}</span>}
                  {activeSection === item.id && (
                    <svg className="profile-nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User card */}
        <div className="profile-sidebar-user">
          <div className="profile-sidebar-user-card">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
              alt="Аватар"
              className="profile-sidebar-avatar"
            />
            <div className="profile-sidebar-info">
              <p className="profile-sidebar-name">{localStorage.getItem('user_name') || 'Алексей Морозов'}</p>
              <p className="profile-sidebar-email">{localStorage.getItem('user_email') || 'a.morozov@mail.ru'}</p>
            </div>
            <button className="profile-sidebar-logout" onClick={handleLogout} title="Выйти">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div className="profile-sidebar-overlay" onClick={onToggle} />
      )}
    </>
  );
}

export default ProfileSidebar;
