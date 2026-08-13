// frontend/src/App.js
import './styles/components/generalpagecss/GeneralPage.css';
import './styles/components/generalpagecss/AnnouncementBar.css';
import './styles/components/generalpagecss/Header.css';
import './styles/components/generalpagecss/Hero.css';
import './styles/components/generalpagecss/TrustBadges.css';
import './styles/components/generalpagecss/Categories.css';
import './styles/components/generalpagecss/ProductCard.css';
import './styles/components/generalpagecss/Promo.css';
import './styles/components/generalpagecss/NewArrivals.css';
import './styles/components/generalpagecss/Brands.css';
import './styles/components/generalpagecss/Newsletter.css';
import './styles/components/generalpagecss/Footer.css';

import {
  AnnouncementBar,
  Header,
  Hero,
  TrustBadges,
  Categories,
  Products,
  Promo,
  NewArrivals,
  Brands,
  Newsletter,
  Footer,
} from './components/componentsforgeneralpage_js';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from './utils/authUtils';

function App() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const onOpenProduct = (product) => {
    navigate(`/products/${product.id}`);
  };

  const onAddToCart = async (product) => {
    try {
      const res = await authFetch('/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1
        }),
      });
      if (res.ok) {
        console.log(`Added ${product.name} to cart`);
      } else {
        const errorData = await res.json();
        console.error('Error adding to cart:', errorData);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load categories
        const catsRes = await fetch('/categories/');
        const catsData = await catsRes.json();
        setCategories(catsData);
        const allProducts = [];
        const newArr = [];

        for (const cat of catsData) {
          try {
            const res = await fetch(`/products/?category_id=${cat.id}&page_size=4`);
            const data = await res.json();
            const items = data.items || data;
            if (items.length > 0) {
              // Popular: first 2 from each category
              allProducts.push(...items.slice(0, 2).map(p => ({ ...p, inStock: p.stock > 0 })));
              // New arrivals: last 1 from each category
              newArr.push({ ...items[items.length - 1], inStock: items[items.length - 1].stock > 0 });
            }
          } catch (err) {
            console.error(`Error loading products for category ${cat.id}:`, err);
          }
        }

        // Deduplicate new arrivals (take unique by id, limit to 4)
        const uniqueNewArr = [];
        const seenIds = new Set();
        for (const p of newArr) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            uniqueNewArr.push(p);
            if (uniqueNewArr.length >= 4) break;
          }
        }

        const uniquePopular = [];
        const popularIds = new Set();
        for (const p of allProducts) {
          if (!popularIds.has(p.id)) {
            popularIds.add(p.id);
            uniquePopular.push(p);
          }
        }

        setPopularProducts(uniquePopular.slice(0, 8));
        setNewArrivals(uniqueNewArr);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="general-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="general-page">
      <AnnouncementBar />
      <Header />
      <main className="general-main">
        <div className="general-container">
          <Hero />
          <TrustBadges />
          <Categories
            categories={categories}
            activeId={activeCategory}
            onSelect={(id) => setActiveCategory(id)}
          />
          <Products products={popularProducts} onOpenProduct={onOpenProduct} />
          <Promo />
          <NewArrivals products={newArrivals} onOpenProduct={onOpenProduct} onAddToCart={onAddToCart} />
          <Brands />
          <Newsletter />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
