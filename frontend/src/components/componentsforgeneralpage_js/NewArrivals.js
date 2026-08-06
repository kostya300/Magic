// frontend/src/components/componentsforgeneralpage_js/NewArrivals.js
import '../../styles/components/generalpagecss/NewArrivals.css';
import { Sparkles } from 'lucide-react';
import StarIcon from './StarIcon';

const fmt = (n) => '₽ ' + n.toLocaleString('ru');

function NewArrivals({ products, onOpenProduct }) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="general-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} style={{ color: '#10b981' }} />
          <h2 className="general-section-title">Новинки</h2>
        </div>
        <button className="general-section-link">Все новинки <span>→</span></button>
      </div>
      <div className="general-new-grid">
        {products.map(p => (
          <div key={p.id} className="general-new-card" onClick={() => onOpenProduct?.(p)} >
            <div className="general-new-img-wrap">
              <img
                src={p.image_url || 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop&auto=format'}
                alt={p.name}
                className="general-new-img"
              />
              <span className="general-new-new-badge">NEW</span>
            </div>
            <div className="general-new-info">
              <p className="general-new-cat">{p.category_name || 'Категория'}</p>
              <p className="general-new-name">{p.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <StarIcon filled={Math.round(p.rating || 0)} />
                <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                  ({p.review_count || 0})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p className="general-new-price">{fmt(p.price)}</p>
                <button className="general-new-cart-btn">В корзину</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NewArrivals;
