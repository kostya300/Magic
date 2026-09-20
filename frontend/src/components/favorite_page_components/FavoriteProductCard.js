// frontend/src/components/favorite_page_components/FavoriteProductCard.js
import { useState } from 'react';
import { ShoppingCart, X, Check } from 'lucide-react';
import { authFetch, isAuthenticated } from '../../utils/authUtils';
import '../../styles/components/favorite_page_components_stayles/FavoriteProductCard.css';

function FavoriteProductCard({ product, fmtPrice, onRemove, onOpenProduct }) {
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    setAdded(true);

    try {
      const response = await authFetch('/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error adding to cart:', errorData);
        alert(errorData.detail || 'Не удалось добавить в корзину');
      } else {
        console.log(`Added ${product.name} to cart`);
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setAdded(false);
    }
  };

  return (
    <div className="favorite-product-card" onClick={onOpenProduct}>
      {/* Изображение */}
      <div className="favorite-product-img-wrap">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="favorite-product-img"
          />
        ) : (
          <div className="favorite-product-img-placeholder">
            <span>{product.name?.charAt(0) || '?'}</span>
          </div>
        )}
        
        {/* Кнопка удаления */}
        <button
          className="favorite-product-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Удалить из избранного"
        >
          <X size={14} />
        </button>

        {/* Индикатор наличия */}
        {product.stock <= 0 && (
          <div className="favorite-product-outofstock">
            <span>Нет в наличии</span>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="favorite-product-info">
        {/* Категория */}
        {product.category && (
          <p className="favorite-product-category">
            {product.category.name || product.category}
          </p>
        )}

        {/* Название */}
        <h3 className="favorite-product-name">{product.name}</h3>

        {/* Рейтинг */}
        {product.rating > 0 && (
          <div className="favorite-product-rating">
            <span className="favorite-product-stars">{'★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating))}</span>
            <span className="favorite-product-rating-value">{product.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Цена и кнопка */}
        <div className="favorite-product-footer">
          <div className="favorite-product-price-block">
            <span className="favorite-product-price">{fmtPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="favorite-product-oldprice">{fmtPrice(product.oldPrice)}</span>
            )}
          </div>
          <button
            className={`favorite-product-cart-btn ${added ? 'added' : product.stock > 0 ? 'instock' : 'disabled'}`}
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || added}
          >
            {added ? (
              <><Check size={14} /> Добавлено</>
            ) : (
              <><ShoppingCart size={14} /> В корзину</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FavoriteProductCard;
