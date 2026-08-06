// frontend/src/components/componentsforgeneralpage_js/Hero.js
import '../../styles/components/generalpagecss/Hero.css';
import { Flame, ArrowRight } from 'lucide-react';

function Hero() {
  return (
    <section className="general-hero">
      {/* Main hero */}
      <div className="general-hero-main">
        <img
          src="https://images.unsplash.com/photo-1562907550-096d3bf9b25c?w=900&h=500&fit=crop&auto=format"
          alt="Ноутбук"
          className="general-hero-img"
        />
        <div className="general-hero-overlay" />
        <div className="general-hero-content">
          <span className="general-hero-badge">
            <Flame size={12} />
            Горячее предложение
          </span>
          <h1 className="general-hero-title">
            MacBook Pro 16"<br />M3 Pro Chip
          </h1>
          <p className="general-hero-sub">
            Новое поколение производительности. Скидка 14% только до конца недели.
          </p>
          <div className="general-hero-actions">
            <button className="general-hero-buy">
              Купить за ₽ 249 990 <ArrowRight size={14} />
            </button>
            <a href="#" className="general-hero-detail">Подробнее</a>
          </div>
        </div>
      </div>

      {/* Side banners */}
      <div className="general-hero-side">
        {/* Banner 1 */}
        <div className="general-hero-banner">
          <img
            src="https://images.unsplash.com/photo-1491927570842-0261e477d937?w=500&h=260&fit=crop&auto=format"
            alt="Наушники"
            className="general-hero-banner-img"
          />
          <div className="general-hero-banner-overlay" />
          <div className="general-hero-banner-content">
            <p style={{ fontSize: '12px', color: '#4f8ef7', fontWeight: 500, marginBottom: '4px' }}>Наушники</p>
            <p className="general-hero-banner-title">Sony WH-1000XM5</p>
            <p className="general-hero-banner-price">от ₽ 28 990</p>
            <button className="general-hero-banner-btn">Смотреть →</button>
          </div>
        </div>

        {/* Banner 2 */}
        <div className="general-hero-banner">
          <img
            src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=260&fit=crop&auto=format"
            alt="Apple Watch"
            className="general-hero-banner-img"
          />
          <div className="general-hero-banner-overlay" />
          <div className="general-hero-banner-content">
            <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 500, marginBottom: '4px' }}>Умные часы</p>
            <p className="general-hero-banner-title">Apple Watch Ultra 2</p>
            <p className="general-hero-banner-price">от ₽ 79 990</p>
            <button className="general-hero-banner-btn">Смотреть →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
