// frontend/src/components/componentsforgeneralpage_js/Products.js
import '../../styles/components/generalpagecss/TrustBadges.css';
import { Flame } from 'lucide-react';
import ProductCard from './ProductCard';

function Products({ products, onOpenProduct }) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="general-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={16} style={{ color: '#4f8ef7' }} />
          <h2 className="general-section-title">Популярные товары</h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {products.map(p => (
          <ProductCard key={p.id} product={{
            ...p,
            inStock: p.stock > 0,
            rating: p.rating || 0,
            review_count: 0,
            oldPrice: Math.round(p.price * 1.15),
          }} onOpen={onOpenProduct} />
        ))}
      </div>
    </section>
  );
}

export default Products;
