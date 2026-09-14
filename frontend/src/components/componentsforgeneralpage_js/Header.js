// frontend/src/components/componentsforgeneralpage_js/Header.js
import '../../styles/components/generalpagecss/Header.css';
import { Zap, Search, Heart, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLink from '../logcomp/AuthLink';
import { isAuthenticated } from '../../utils/authUtils';
const navLinks = ['Каталог', 'Акции', 'Бренды', 'Новинки', 'Контакты'];

function Header({ cartCount = 0, categories = [] }) {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="general-header">
      <div className="general-header-inner">
        {/* Logo */}
        <div className="general-logo" onClick={() => navigate('/')}>          <div className="general-logo-icon">
            <Zap size={16} />
          </div>
          <span className="general-logo-text">Mr.Store</span>
        </div>

        {/* Desktop nav */}
        <nav className="general-nav">
          {navLinks.map(link => (
            <a
              key={link}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(link === 'Каталог' ? '/' : `/category?name=${link}`);
              }}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Search */}
        <div className="general-search-wrap">
          <div className="general-search">
            <Search size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск товаров, брендов, категорий..."
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#6b7280' }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="general-header-actions">
          <AuthLink className="general-auth-desktop" />

          <button className="general-header-btn">
            <Heart size={16} />
          </button>
          <button className="general-header-btn" onClick={() => navigate(isAuthenticated() ? '/cart' : '/login')}>
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span className="general-header-badge">{cartCount}</span>
            )}
          </button>
          <button className="general-header-btn" onClick={() => navigate(isAuthenticated() ? '/profile' : '/login')}>
            <User size={16} />
          </button>
          <button
            className="general-header-btn burger-btn"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`general-mobile-menu ${mobileMenu ? 'open' : ''}`}>
        {navLinks.map(link => (
          <a
            key={link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenu(false);
              navigate(link === 'Каталог' ? '/' : `/category?name=${link}`);
            }}
          >
            {link}
          </a>
        ))}
        <div className="general-mobile-auth">
          <AuthLink />
        </div>
      </div>
    </header>
  );
}

export default Header;
