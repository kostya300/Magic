// frontend/src/pages/ProfilePage.js
import { useState, useEffect } from 'react';
import { authFetch, isAuthenticated, clearAuthTokens } from '../utils/authUtils';
import '../styles/components/profilecss/ProfilePage.css';
import ProfileSidebar from '../components/componentsforprofilepage/ProfileSidebar';
import ProfileTopbar from '../components/componentsforprofilepage/ProfileTopbar';
import StatsCards from '../components/componentsforprofilepage/StatsCards';
import ChartArea from '../components/componentsforprofilepage/ChartArea';
import ActivityFeed from '../components/componentsforprofilepage/ActivityFeed';
import OrdersTable from '../components/componentsforprofilepage/OrdersTable';
import ProfileCard from '../components/componentsforprofilepage/ProfileCard';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        localStorage.setItem('user_email', data.email);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleToggleSidebar = () => setSidebarOpen(prev => !prev);

  if (loading) return <div className="profile-page">Загрузка...</div>;
  if (error) return (
    <div className="profile-page">
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
    <div className="profile-page">
      {/* Sidebar */}
      <ProfileSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
      />

      {/* Main area */}
      <div className="profile-page-main">
        <ProfileTopbar
          onMenuClick={handleToggleSidebar}
          userName={user?.email}
        />

        <div className="profile-page-scroll">
          {/* Page header */}
          <div className="profile-page-header">
            <h1 className="profile-page-title">Обзор</h1>
            <p className="profile-page-subtitle">Добро пожаловать! Вот что происходит сегодня.</p>
          </div>

          {/* Stats cards */}
          <div style={{ marginBottom: '24px' }}>
            <StatsCards />
          </div>

          {/* Chart + Activity grid */}
          <div className="profile-grid" style={{ marginBottom: '24px' }}>
            <ChartArea />
            <ActivityFeed />
          </div>

          {/* Orders table */}
          <div style={{ marginBottom: '24px' }}>
            <OrdersTable />
          </div>

          {/* Profile card */}
          <ProfileCard />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
