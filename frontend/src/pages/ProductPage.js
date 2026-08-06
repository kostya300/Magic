// frontend/src/pages/ProductPage.js
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authFetch, isAuthenticated, clearAuthTokens } from '../utils/authUtils';
import { Newsletter } from '../components/componentsforgeneralpage_js';
import { Brands} from "../components/componentsforgeneralpage_js";
import { Header, Footer } from '../components/componentsforgeneralpage_js';
import '../styles/components/productPage/ProductPageCard.css';
import '../styles/components/generalpagecss/Brands.css';
import '../styles/components/productPage/Breadcrumb.css';
import '../styles/components/productPage/Gallery.css';
import '../styles/components/productPage/ProductInfo.css';
import '../styles/components/productPage/Tabs.css';
import '../styles/components/productPage/RelatedProducts.css';

import Breadcrumb from '../components/ProductPageComponents/Breadcrumb';
import Gallery from '../components/ProductPageComponents/Gallery';
import ProductInfo from '../components/ProductPageComponents/ProductInfo';
import Tabs from '../components/ProductPageComponents/Tabs';
import RelatedProducts from '../components/ProductPageComponents/RelatedProducts';

function ProductPage() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productRes, categoriesRes] = await Promise.all([
                    fetch(`/products/${productId}/`),
                    fetch('/categories/')
                ]);

                const [productData, categoriesData] = await Promise.all([
                    productRes.json(),
                    categoriesRes.json()
                ]);

                setProduct(productData);
                setCategories(categoriesData);

                // Load related products (same category)
                if (productData.category_id) {
                    try {
                        const relatedRes = await fetch(`/products/?category_id=${productData.category_id}&page_size=4`);
                        const relatedData = await relatedRes.json();
                        const items = relatedData.items || relatedData;
                        setRelatedProducts(
                            items
                                .filter(p => p.id !== productData.id)
                                .slice(0, 4)
                        );
                    } catch (err) {
                        console.error('Error loading related products:', err);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId]);

    const handleAddToCart = () => {
        // TODO: Add to cart logic
        console.log('Added to cart:', product?.name);
    };

    const handleOpenProduct = (p) => {
        navigate(`/product/${p.id}`);
    };

    const handleHomeClick = () => {
        navigate('/');
    };

    const onOpenProduct = (p) => {
        navigate(`/products/${p.id}`);
    };

    if (loading) return (
        <div className="general-page">
            <Header />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
                Загрузка...
            </div>
        </div>
    );

    if (!product) return (
        <div className="general-page">
            <Header />
            <main className="general-main">
                <div className="general-container">
                    <h2>Товар не найден</h2>
                    <Link to="/">← На главную</Link>
                </div>
            </main>
            <Footer />
        </div>
    );

    return (
        <div className="general-page">
            <Header />


            <main className="general-main">
                <div className="general-container">
                    <div className="product-detail product-detail-new">
                        <Breadcrumb product={product} onHomeClick={handleHomeClick} />

                        <div className="product-main-content">
                            <div className="product-grid">
                                <Gallery product={product} />
                                <ProductInfo
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                />
                            </div>

                            <Tabs product={product} />

                            {relatedProducts.length > 0 && (
                                <RelatedProducts
                                    products={relatedProducts}
                                    onOpenProduct={onOpenProduct}
                                />
                            )}
                        </div>
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

export default ProductPage;
