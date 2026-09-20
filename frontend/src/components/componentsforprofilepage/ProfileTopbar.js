// frontend/src/components/componentsforprofilepage/ProfileTopbar.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/profilecss/Topbar.css';
import '../../styles/components/profilecss/NotificationsDropdown.css';
import { Menu, Search, Bell } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';

function ProfileTopbar({ onMenuClick, userName }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="profile-topbar">
      {/* Mobile menu toggle */}
      <button className="profile-mobile-toggle" onClick={onMenuClick}>
        <Menu size={18} />
      </button>
      {/* Actions */}
      <div className="profile-topbar-actions">
        <div className="profile-notif-wrapper">
          <button 
            className="profile-notif-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={15} />
            <span className="profile-notif-dot" />
          </button>
          <NotificationsDropdown 
            isOpen={showNotifications} 
            onClose={() => setShowNotifications(false)} 
          />
        </div>
        <div
          className="profile-avatar-top"
          onClick={() => navigate('/profile/user')}
          style={{ cursor: 'pointer' }}
        >
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
            alt="Аватар"
            className="profile-avatar-top-img"
          />
        </div>
      </div>
    </header>
  );
}

export default ProfileTopbar;
