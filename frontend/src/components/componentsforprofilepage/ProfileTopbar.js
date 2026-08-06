// frontend/src/components/componentsforprofilepage/ProfileTopbar.js
import '../../styles/components/profilecss/Topbar.css';
import { Menu, Search, Bell } from 'lucide-react';

function ProfileTopbar({ onMenuClick, userName }) {
  return (
    <header className="profile-topbar">
      {/* Mobile menu toggle */}
      <button className="profile-mobile-toggle" onClick={onMenuClick}>
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="profile-search-wrap">
        <div className="profile-search">
          <Search size={13} />
          <input type="text" placeholder="Поиск..." />
        </div>
      </div>

      {/* Actions */}
      <div className="profile-topbar-actions">
        <button className="profile-notif-btn">
          <Bell size={15} />
          <span className="profile-notif-dot" />
        </button>
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
          alt="Аватар"
          className="profile-avatar-top"
        />
      </div>
    </header>
  );
}

export default ProfileTopbar;
