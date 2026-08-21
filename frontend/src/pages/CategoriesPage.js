// frontend/src/pages/CategoriesPage.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer, Brands, Newsletter } from '../components/componentsforgeneralpage_js';
import CategoryCard from '../components/CategoriesPage/CategoryCard';
import '../styles/components/CategoriesPage/CategoriesPage.css';

function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

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

        fetchCategories();
    }, []);

    if (loading) return (
        <div className="general-page">
            <Header />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
                Загрузка...
            </div>
        </div>
    );

    return (
        <div className="general-page">
            <Header />

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
