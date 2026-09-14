// frontend/src/components/componentsforgeneralpage_js/NewArrivals.js
import { useState } from 'react';
import '../../styles/components/generalpagecss/NewArrivals.css';
import { Sparkles } from 'lucide-react';
import StarIcon from './StarIcon';
import { isAuthenticated, authFetch } from '../../utils/authUtils';

const fmt = (n) => '₽ ' + n.toLocaleString('ru');

function NewArrivals({ products, onOpenProduct, onAddToCart }) {
    const [addedIds, setAddedIds] = useState({});

    if (!products || products.length === 0) {
        return null;
    }

    const handleAddToCart = async (product) => {
        if (!product.inStock) return;
        if (!isAuthenticated()) {
            window.location.href = '/login';
            return;
        }
        setAddedIds(prev => ({ ...prev, [product.id]: true }));
        try {
            await authFetch('/cart/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: product.id, quantity: 1 }),
            });
            setTimeout(() => setAddedIds(prev => ({ ...prev, [product.id]: false })), 1400);
        } catch (err) {
            console.error('Failed to add to cart:', err);
            setAddedIds(prev => ({ ...prev, [product.id]: false }));
        }
    };

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
                    <div key={p.id} className="general-new-card" onClick={() => onOpenProduct?.(p)}>
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
                                <span style={{
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    fontFamily: 'JetBrains Mono, monospace'
                                }}>
                  ({p.review_count || 0})
                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <p className="general-new-price">{fmt(p.price)}</p>
                                <button
                                    className={`general-product-cart-btn ${
                                        addedIds[p.id] ? 'added' : p.inStock ? 'instock' : 'disabled'
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCart(p);
                                    }}
                                    disabled={!p.inStock}
                                >
                                    {addedIds[p.id] ? 'Добавлено ✓' : 'В корзину'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default NewArrivals;
