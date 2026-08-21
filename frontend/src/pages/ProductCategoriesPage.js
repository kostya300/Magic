// frontend/src/pages/ProductCategoriesPage.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header, Footer, Brands, Newsletter } from '../components/componentsforgeneralpage_js';
import ProductCard from '../components/componentsforgeneralpage_js/ProductCard';
import '../styles/components/ProductCategoriesPageComponentsCss/ProductCategoriesPage.css';

function ProductCategoriesPage() {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch(`/products/?category_id=${categoryId}&page_size=100`),
                    fetch('/categories/')
                ]);

                const [productsData, categoriesData] = await Promise.all([
                    productsRes.json(),
                    categoriesRes.json()
                ]);

                // Find current category
                const foundCategory = categoriesData.find(c => c.id === parseInt(categoryId));
                setCategory(foundCategory);

                // Map products for ProductCard
                const items = productsData.items || productsData;
                setProducts(items.map(p => ({
                    ...p,
                    inStock: p.stock > 0,
                    category_name: foundCategory?.name || 'Категория',
                    review_count: p.reviews?.length || 0,
                })));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId]);

    if (loading) return (
        <div className="general-page">
            <Header />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
                Загрузка...
            </div>
        </div>
    );

    if (!category) return (
        <div className="general-page">
            <Header />
            <main className="general-main">
                <div className="general-container">
                    <h2>Категория не найдена</h2>
                    <Link to="/categories">← Вернуться к категориям</Link>
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

    return (
        <div className="general-page">
            <Header />

            <main className="general-main">
                <div className="general-container">
                    <div className="product-categories-page">
                        {/* Breadcrumb */}
                        <div className="product-categories-breadcrumb">
                            <Link to="/categories" className="breadcrumb-link">
                              Категории
                            </Link>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-current">{category.name}</span>
                        </div>

                        {/* Page Title */}
                        <h1 className="product-categories-title">{category.name}</h1>

                        {products.length > 0 ? (
                            <div className="products-grid">
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onOpen={(p) => navigate(`/products/${p.id}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="products-empty">В этой категории пока нет товаров</p>
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

export default ProductCategoriesPage;
