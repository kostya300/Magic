// frontend/src/pages/CategoriesPage.js
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header, Footer, Brands, Newsletter } from '../components/componentsforgeneralpage_js';
import { authFetch } from '../utils/authUtils';
import CategoryCard from '../components/CategoriesPage/CategoryCard';
import '../styles/components/CategoriesPage/CategoriesPage.css';

function CategoriesPage() {
    const location = useLocation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
    },[location.pathname]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/categories/');
                const data = await res.json();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

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

        fetchCategories();
        loadCartCount();
    }, []);

    if (loading) return (
        <div className="general-page">
            <Header cartCount={cartCount} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
                Загрузка...
            </div>
        </div>
    );

    return (
        <div className="general-page">
            <Header cartCount={cartCount} />

            <main className="general-main">
                <div className="general-container">
                    <div className="categories-page">
                        <h1 className="categories-page-title">Категории</h1>

                        {categories.length > 0 ? (
                            <div className="categories-grid">
                                {categories.map((category) => (
                                    <CategoryCard key={category.id} category={category} />
                                ))}
                            </div>
                        ) : (
                            <p className="categories-empty">Категории отсутствуют</p>
                        )}
                    </div>
                </div>
            </main>

            <footer>
                <div className="general-container">
                    <Brands />
                    <Newsletter />
                </div>
                <Footer />
            </footer>
        </div>
    );
}

export default CategoriesPage;
