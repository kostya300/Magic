// frontend/src/components/componentsforgeneralpage_js/Hero.js
import '../../styles/components/generalpagecss/Hero.css';
import { Flame, ArrowRight } from 'lucide-react';

function Hero({ featuredProduct, onOpenProduct }) {
  const heroImage = featuredProduct?.image_url || 'https://gsm-store.ru/upload/medialibrary/857/85732cb2be9ce11c88e73ffefedcb5d2.jpg';
  const name = featuredProduct?.name || 'Спецпредложение';
  const price = featuredProduct ? `₽ ${Number(featuredProduct.price).toLocaleString('ru')}` : '₽ 249 990';
  return (
    <section className="general-hero">
      {/* Main hero */}
      <div className="general-hero-main">
        <img
          src={heroImage}
          alt="Спецпредложение"
          className="general-hero-img"
        />
        <div className="general-hero-overlay" />
        <div className="general-hero-content">
          <span className="general-hero-badge">
            <Flame size={12} />
            Горячее предложение
          </span>
          <h1 className="general-hero-title">
            {name}
          </h1>
          <p className="general-hero-sub">
            Отличный выбор по выгодной цене
          </p>
          <div className="general-hero-actions">
            <button 
              className="general-hero-buy"
              onClick={() => onOpenProduct && onOpenProduct(featuredProduct)}
              disabled={!featuredProduct}
            >
              Купить за {price} <ArrowRight size={14} />
            </button>
            <a 
              href="#" 
              className="general-hero-detail"
              onClick={(e) => {
                e.preventDefault();
                onOpenProduct && onOpenProduct(featuredProduct);
              }}
            >
              Подробнее
            </a>
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
