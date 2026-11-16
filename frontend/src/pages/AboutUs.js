// frontend/src/pages/AboutUs.js
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header, Footer, Brands, Newsletter } from '../components/componentsforgeneralpage_js';
import { authFetch } from '../utils/authUtils';
import '../styles/components/AboutUsJsPage/AboutUsJsPage.css';

function AboutUs() {
    const location = useLocation();
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useEffect(() => {
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

        loadCartCount();
    }, []);

    return (
        <div className="general-page">
            <Header cartCount={cartCount} />

            <main className="general-main">
                <div className="general-container">
                    <div className="aboutus-page">
                        <h1 className="aboutus-page-title">О нас</h1>

                        <div className="aboutus-content">
                            <section className="aboutus-section">
                                <h2 className="aboutus-section-title">Наша миссия</h2>
                                <p className="aboutus-text">
                                    TechStore — официальный магазин электроники. Мы стремимся сделать
                                    современные технологии доступными для каждого. Более 10 000 товаров
                                    с гарантией качества — от смартфонов и ноутбуков до умных часов и
                                    аксессуаров.
                                </p>
                            </section>

                            <section className="aboutus-section">
                                <h2 className="aboutus-section-title">Почему выбирают нас</h2>
                                <div className="aboutus-features">
                                    <div className="aboutus-feature">
                                        <div className="aboutus-feature-icon">✓</div>
                                        <h3 className="aboutus-feature-title">Гарантия качества</h3>
                                        <p className="aboutus-feature-desc">
                                            Только оригинальная продукция от официальных поставщиков.
                                        </p>
                                    </div>
                                    <div className="aboutus-feature">
                                        <div className="aboutus-feature-icon">✓</div>
                                        <h3 className="aboutus-feature-title">Быстрая доставка</h3>
                                        <p className="aboutus-feature-desc">
                                            Доставляем по всей России в кратчайшие сроки.
                                        </p>
                                    </div>
                                    <div className="aboutus-feature">
                                        <div className="aboutus-feature-icon">✓</div>
                                        <h3 className="aboutus-feature-title">Поддержка клиентов</h3>
                                        <p className="aboutus-feature-desc">
                                            Наша команда всегда готова помочь с выбором и оформлением заказа.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="aboutus-section">
                                <h2 className="aboutus-section-title">Контакты</h2>
                                <div className="aboutus-contacts">
                                    <p className="aboutus-contact-item">
                                        <strong>Телефон:</strong> 8 (800) 123-45-67
                                    </p>
                                    <p className="aboutus-contact-item">
                                        <strong>Email:</strong> info@techstore.ru
                                    </p>
                                    <p className="aboutus-contact-item">
                                        <strong>Адрес:</strong> г. Москва, ул. Примерная, д. 1
                                    </p>
                                </div>
                            </section>
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

export default AboutUs;
