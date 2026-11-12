// frontend/src/components/componentsforgeneralpage_js/Header.js
import '../../styles/components/generalpagecss/Header.css';
import {Zap, Search, Heart, ShoppingCart, User, Menu, X} from 'lucide-react';
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import AuthLink from '../logcomp/AuthLink';
import {isAuthenticated} from '../../utils/authUtils';

const navLinks = ['Каталог', 'Акции', 'Бренды', 'Новинки', 'Контакты'];

function Header({cartCount = 0, categories = [], onSearch}) {
    const navigate = useNavigate();
    const [mobileMenu, setMobileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);

    // Debounce для запросов автодополнения
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                fetchSuggestions(searchQuery.trim());
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSuggestions = async (query) => {
        try {
            const res = await fetch(`/products/search/suggestions?q=${encodeURIComponent(query)}&limit=5`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setShowSuggestions(true);
            }
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion);
        setShowSuggestions(false);
        handleSearch();
    };

    const handleKeyDownSuggestions = (e) => {
        if (suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestion(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && activeSuggestion >= 0) {
            e.preventDefault();
            handleSuggestionClick(suggestions[activeSuggestion]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setActiveSuggestion(-1);
        }
    };

    // Закрытие подсказок при клике вне
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.general-search-wrap')) {
                setShowSuggestions(false);
                setActiveSuggestion(-1);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleSearch = () => {
        const trimmed = searchQuery.trim();
        if (trimmed.length > 100) {
            alert('Поисковый запрос не может превышать 100 символов');
            setSearchQuery('');
            return;
        }
        if (trimmed) {
            navigate(`/search?q=${encodeURIComponent(trimmed)}`);
            setSearchQuery('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <header className="general-header">
            <div className="general-header-inner">
                {/* Logo */}
                <div className="general-logo" onClick={() => navigate('/')}>
                    <div className="general-logo-icon">
                        <Zap size={16}/>
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
                                navigate(link === 'Каталог' ? '/categories' : `/category?name=${link}`);
                            }}
                        >
                            {link}
                        </a>
                    ))}
                </nav>

                {/* Search */}
                <div className="general-search-wrap">
                    <div className="general-search">
                        <Search size={14}/>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => {
                                setSearchQuery(e.target.value);
                                setActiveSuggestion(-1);
                            }}
                            onKeyDown={handleKeyDownSuggestions}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            placeholder="Поиск товаров, брендов, категорий..."
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                color: '#6b7280'
                            }}>
                                <X size={13}/>
                            </button>
                        )}
                    </div>
                    <button className="general-search-btn" onClick={handleSearch}>
                        <Search size={16}/>
                    </button>
                    
                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="general-search-suggestions">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={`general-suggestion-item ${index === activeSuggestion ? 'active' : ''}`}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    onMouseEnter={() => setActiveSuggestion(index)}
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="general-header-actions">
                    <AuthLink className="general-auth-desktop"/>

                    <button className="general-header-btn" onClick={() => navigate(isAuthenticated() ? '/favorites' : '/login')}>
                        <Heart size={16}/>
                    </button>
                    <button className="general-header-btn"
                            onClick={() => navigate(isAuthenticated() ? '/cart' : '/login')}>
                        <ShoppingCart size={16}/>
                        {cartCount > 0 && (
                            <span className="general-header-badge">{cartCount}</span>
                        )}
                    </button>
                    <button className="general-header-btn"
                            onClick={() => navigate(isAuthenticated() ? '/profile' : '/login')}>
                        <User size={16}/>
                    </button>
                    <button
                        className="general-header-btn burger-btn"
                        onClick={() => setMobileMenu(!mobileMenu)}
                    >
                        {mobileMenu ? <X size={16}/> : <Menu size={16}/>}
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
                            navigate(link === 'Каталог' ? '/categories' : `/category?name=${link}`);
                        }}
                    >
                        {link}
                    </a>
                ))}
                <div className="general-mobile-auth">
                    <AuthLink/>
                </div>
            </div>
        </header>
    );
}

export default Header;
