import { useState, useEffect } from 'react'; // 👈 добавьте useEffect
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, authFetch } from '../utils/authUtils';
import { Header, Footer, Newsletter, Brands } from '../components/componentsforgeneralpage_js';
import CartEmpty from '../components/componentscart/CartEmpty';
import CartItem from '../components/componentscart/CartItem';
import CartSummary from '../components/componentscart/CartSummary';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCart = async () => {
    try {
      const res = await authFetch('/cart/');
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      } else {
        if (res.status === 401) setError('Сессия истекла');
        else setError('Не удалось загрузить корзину');
      }
    } catch (err) {
      console.error('Cart load error:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (isAuthenticated()) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, []);

  const handleUpdateQty = async (productId, newQty) => {
    try {
      const res = await authFetch(`/cart/items/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) loadCart();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await authFetch(`/cart/items/${productId}`, { method: 'DELETE' });
      if (res.ok) loadCart();
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  const handleClear = async () => {
    try {
      const res = await authFetch('/cart/', { method: 'DELETE' });
      if (res.ok) {
        setCart(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Clear error:', err);
    }
  };

  const handleCheckout = async () => {
    try {
      const res = await authFetch('/orders/checkout', { method: 'POST' });
      if (res.ok) {
        navigate('/profile');
      } else {
        const errorData = await res.json();
        alert(errorData.detail || 'Ошибка оформления заказа');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Ошибка подключения к серверу');
    }
  };

  // 👇 Проверяем авторизацию ДО загрузки
  if (!isAuthenticated()) {
    return (
      <div className="general-page">
        <Header />
        <div style={{ padding: 80, textAlign: 'center' }}>
          <p style={{ color: '#374151', marginBottom: 16 }}>Для просмотра корзины необходимо авторизоваться</p>
          <a href="/login" style={{ color: '#4f8ef7', fontWeight: 600 }}>Войти</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="general-page">
        <Header />
        <div style={{ padding: 80, textAlign: 'center', color: '#6b7280' }}>Загрузка корзины...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="general-page">
        <Header />
        <div style={{ padding: 80, textAlign: 'center', color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="general-page">
        <Header />
        <CartEmpty onGoHome={() => navigate('/')} />
        <footer>
          <div className="general-container"><Brands /><Newsletter /></div>
          <Footer />
        </footer>
      </div>
    );
  }

  return (
    <div className="general-page">
      <Header />
      <div className="cart-page">
        <h1 className="cart-title">Корзина</h1>
        <div className="cart-layout">
          <div className="cart-items-list">
            {cart.items.map((item) => (
              <CartItem
                key={item.product.id}
                item={item}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemove}
              />
            ))}
          </div>
          <CartSummary
            items={cart.items}
            totalQty={cart.total_quantity}
            totalPrice={cart.total_price}
            onCheckout={handleCheckout}
            onClear={handleClear}
          />
        </div>
      </div>
      <footer>
        <div className="general-container"><Brands /><Newsletter /></div>
        <Footer />
      </footer>
    </div>
  );
}