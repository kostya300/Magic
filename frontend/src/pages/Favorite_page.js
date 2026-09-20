// frontend/src/pages/Favorite_page.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authUtils';
import { Header, Footer, Brands, Newsletter } from '../components/componentsforgeneralpage_js';
import FavoriteProductCard from '../components/favorite_page_components/FavoriteProductCard';
import '../styles/components/favorite_page_components_stayles/FavoritePage.css';

function FavoritePage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const fmtPrice = (price) => `₽ ${Number(price).toLocaleString('ru')}`;

  const fetchFavorites = async () => {
    try {
      const res = await authFetch('/favorites/');
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      } else {
        setError('Не удалось загрузить избранное');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
    loadCartCount();
  }, []);

  const loadCartCount = async () => {
    try {
      const res = await authFetch('/cart/');
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.total_quantity || 0);
      }
    } catch (err) {
      console.error('Error loading cart count:', err);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await authFetch(`/favorites/${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFavorites(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Error removing from favorites:', err);
    }
  };

  const handleOpenProduct = (product) => {
    navigate(`/products/${product.id}`);
  };

  if (loading) {
    return (
      <div className="general-page">
        <Header cartCount={cartCount} />
        <main className="general-main">
          <div className="general-container">
            <div className="favorite-loading">
              <div className="favorite-spinner"></div>
              <p>Загрузка избранного...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="general-page">
      <Header cartCount={cartCount} />

      <main className="general-main">
        <div className="general-container">
          <div className="favorite-page">
            <div className="favorite-header">
              <h1 className="favorite-title">Избранное</h1>
              <p className="favorite-subtitle">
                {favorites.length} {favorites.length === 1 ? 'товар' : favorites.length < 5 ? 'товара' : 'товаров'}
              </p>
            </div>

            {error && (
              <div className="favorite-error">
                <p>{error}</p>
                <button onClick={fetchFavorites} className="favorite-retry-btn">
                  Попробовать снова
                </button>
              </div>
            )}

            {favorites.length === 0 && !error ? (
              <div className="favorite-empty">
                <div className="favorite-empty-icon">♡</div>
                <h2 className="favorite-empty-title">В избранном пока пусто</h2>
                <p className="favorite-empty-text">
                  Добавьте товары в избранное, нажав на сердечко на странице товара
                </p>
                <button
                  className="favorite-shop-btn"
                  onClick={() => navigate('/')}
                >
                  Перейти в каталог
                </button>
              </div>
            ) : (
              <div className="favorite-grid">
                {favorites.map((product) => (
                  <FavoriteProductCard
                    key={product.id}
                    product={product}
                    fmtPrice={fmtPrice}
                    onRemove={() => handleRemove(product.id)}
                    onOpenProduct={() => handleOpenProduct(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer>
        <div className="general-container">
          <Brands />
        </div>
        <Footer />
      </footer>
    </div>
  );
}

export default FavoritePage;
