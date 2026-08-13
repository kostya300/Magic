// frontend/src/components/componentsforgeneralpage_js/ProductCard.js
import '../../styles/components/generalpagecss/ProductCard.css';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { isAuthenticated, authFetch } from '../../utils/authUtils';

function StarIcon({ filled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={filled ? 'filled' : 'empty'}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function Stars({ rating }) {
  const rounded = Math.round(rating);
  return (
    <div className="general-product-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <StarIcon key={i} filled={i <= rounded} />
      ))}
    </div>
  );
}

const fmt = (n) => '₽ ' + n.toLocaleString('ru');

const badgeMap = {
  hit: { cls: 'hit', label: 'Хит' },
  discount: { cls: 'discount', label: `−${Math.round(((product) => product.oldPrice && product.price ? ((product.oldPrice - product.price) / product.oldPrice * 100)() : 0))}%` },
  new: { cls: 'new', label: 'Новинка' },
  top: { cls: 'top', label: 'Топ продаж' },
  game: { cls: 'hit', label: 'Игровой' },
};

function ProductCard({ product, compact = false, onOpen }) {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);

  const discount = product.oldPrice && product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleAdd = async () => {
    if (!product.inStock) return;
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    setAdded(true);
    try {
      await authFetch('/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      setTimeout(() => setAdded(false), 1400);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setAdded(false);
    }
  };

  return (
    <div className="general-product" onClick={() => onOpen?.(product)}>
      {/* Image */}
      <div className={`general-product-img-wrap ${compact ? 'compact' : 'standard'}`}>
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop&auto=format'}
          alt={product.name}
          className="general-product-img"
        />
        {/* Badges */}
        <div className="general-product-badges">
          {discount > 0 && (
            <span className="general-product-badge discount">−{discount}%</span>
          )}
        </div>
        {/* Wishlist */}
        <button
          className={`general-product-wish${wished ? ' active' : ''}`}
          onClick={() => setWished(!wished)}
        >
          <Heart size={13} />
        </button>
        {/* Out of stock */}
        {!product.inStock && (
          <div className="general-product-outofstock">
            <span>Нет в наличии</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="general-product-info">
        <p className="general-product-category">{product.category_name || 'Категория'}</p>
        <p className="general-product-name">{product.name}</p>
        <div className="general-product-stars">
          <Stars rating={product.rating || 0} />
          <span className="general-product-rating">
            {product.rating || '0'} ({product.review_count || 0})
          </span>
        </div>
        <div className="general-product-footer">
          <div>
            <p className="general-product-price">{fmt(product.price)}</p>
            {product.oldPrice && (
              <p className="general-product-oldprice">{fmt(product.oldPrice)}</p>
            )}
          </div>
          <button
            className={`general-product-cart-btn ${
              added ? 'added' : product.inStock ? 'instock' : 'disabled'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
            disabled={!product.inStock}
          >
            {added ? 'Добавлено ✓' : 'В корзину'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
