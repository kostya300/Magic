// frontend/src/pages/SearchResults.js
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authUtils';
import '../styles/components/generalpagecss/ProductCard.css';
import '../styles/components/generalpagecss/Header.css';
import '../styles/components/generalpagecss/Footer.css';
import AnnouncementBar from '../components/componentsforgeneralpage_js/AnnouncementBar';
import Header from '../components/componentsforgeneralpage_js/Header';
import Footer from '../components/componentsforgeneralpage_js/Footer';
import StarIcon from '../components/componentsforgeneralpage_js/StarIcon';

const fmt = (n) => '₽ ' + Number(n).toLocaleString('ru');

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setLoading(false);
        return;
      }
      try {
        const res = await authFetch(`/products/?search=${encodeURIComponent(query)}&page_size=20`);
        if (!res.ok) throw new Error('Ошибка поиска');
        const data = await res.json();
        setProducts(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    searchProducts();
  }, [query]);

  const onOpenProduct = (product) => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="general-page">
      <AnnouncementBar />
      <Header />
      <main className="general-main">
        <div className="general-container">
          <div className="search-results-page">
            <h1 className="search-results-title">
              Результаты поиска: "{query}"
            </h1>
            <p className="search-results-count">
              Найдено товаров: {products.length}
            </p>

            {loading ? (
              <div className="search-results-loading">Поиск...</div>
            ) : error ? (
              <div className="search-results-error">{error}</div>
            ) : products.length === 0 ? (
              <div className="search-results-empty">
                <p>Ничего не найдено по запросу "{query}"</p>
                <button onClick={() => navigate('/')}>На главную</button>
              </div>
            ) : (
              <div className="search-results-grid">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="general-product"
                    onClick={() => onOpenProduct(product)}
                  >
                    <div className="general-product-img-wrap standard">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop&auto=format'}
                        alt={product.name}
                        className="general-product-img"
                      />
                    </div>
                    <div className="general-product-info">
                      <p className="general-product-category">{product.category_name || 'Категория'}</p>
                      <p className="general-product-name">{product.name}</p>
                      <div className="general-product-stars">
                        <StarIcon filled={Math.round(product.rating || 0)} />
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
                          className={`general-product-cart-btn ${product.stock > 0 ? 'instock' : 'disabled'}`}
                          onClick={(e) => e.stopPropagation()}
                          disabled={!product.stock > 0}
                        >
                          {product.stock > 0 ? 'В корзину' : 'Нет в наличии'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default SearchResults;
