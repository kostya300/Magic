import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/authUtils';
import CancelOrderForm from './componentfororderlistjs/CancelOrderForm';
import CheckoutForm from './componentfororderlistjs/CheckoutForm';
import PaymentConfirmed from './componentfororderlistjs/PaymentConfirmed';
import '../../styles/components/orderpagecomponentsstyles/OrdersList.css';

function OrdersList({ orders, onUpdate }) {
  const navigate = useNavigate();
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  const fmtPrice = (price) => `₽ ${Number(price).toLocaleString('ru')}`;
  const getStatusLabel = (status) => {
    const labels = { 
      pending: 'Ожидает обработки', 
      awaiting_payment: 'Ожидает оплаты', 
      confirmed: 'Подтверждён', 
      shipped: 'Отправлен', 
      delivered: 'Доставлен', 
      cancelled: 'Отменён',
      paid: 'Оплачен'
    };
    return labels[status] || status;
  };
  const getStatusColor = (status) => {
    const colors = { 
      pending: '#f59e0b', 
      awaiting_payment: '#f97316', 
      confirmed: '#3b82f6', 
      shipped: '#8b5cf6', 
      delivered: '#10b981', 
      cancelled: '#ef4444',
      paid: '#10b981'
    };
    return colors[status] || '#6b7280';
  };
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Обновляем список заказов при возврате из YooKassa
  useEffect(() => {
    const interval = setInterval(async () => {
      const hasAwaitingPayment = orders.some(o => o.status === 'awaiting_payment');
      if (hasAwaitingPayment) {
        try {
          const res = await authFetch('/orders/?page=1&page_size=100');
          if (res.ok) {
            const data = await res.json();
            const hasPaidOrders = data.items?.some(o => o.status === 'paid');
            if (hasPaidOrders) {
              window.location.reload();
            }
          }
        } catch (err) {
          console.error('Error checking order status:', err);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orders]);

  const handleCheckout = async (data) => {
    try {
      console.log('[Checkout] Order:', checkoutOrder);
      console.log('[Checkout] Payment method:', data.payment);
      
      const res = await authFetch(`/orders/${checkoutOrder}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[Checkout] Response status:', res.status);
      
      if (res.ok) {
        const result = await res.json();
        console.log('[Checkout] Payment result:', result);
        
        if (result.payment_url) {
          console.log('[Checkout] Redirecting to:', result.payment_url);
          window.location.href = result.payment_url;
        } else {
          alert('Ошибка: отсутствует URL для оплаты');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('[Checkout] Error:', errorData);
        alert(errorData.detail || 'Ошибка при создании платежа');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Ошибка при оформлении заказа');
    }
  };

  const handleCancelCheckout = () => setCheckoutOrder(null);
  const handleCloseConfirmed = () => {
    setConfirmedOrder(null);
    window.location.reload();
  };
  const handleGoHome = () => navigate('/');

  return (
    <>
      <div className="orders-list">
        <button className="orders-home-btn" onClick={handleGoHome}>
          ← На главную
        </button>
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            {order.status !== 'cancelled' && cancellingOrder === order.id && (
              <CancelOrderForm
                orderId={order.id}
                onConfirm={() => setCancellingOrder(null)}
                onCancel={() => setCancellingOrder(null)}
                onUpdate={onUpdate}
              />
            )}
            {order.status !== 'cancelled' && cancellingOrder !== order.id && (
              <button
                className="order-cancel-btn"
                onClick={() => setCancellingOrder(order.id)}
              >
                Отменить заказ
              </button>
            )}
            {order.status === 'cancelled' && (
              <span className="order-cancelled-badge">Отменён</span>
            )}

            <div className="order-card-header">
              <div className="order-card-info">
                <span className="order-id">Заказ #{order.id}</span>
                <span className="order-date">
                  {new Date(order.created_at).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span
                className="order-status"
                style={{ color: getStatusColor(order.status) }}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="order-items">
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row">
                  <div className="order-item-info">
                    <span className="order-item-name">
                      {item.product?.name || 'Товар'}
                    </span>
                    <span className="order-item-qty">
                      × {item.quantity} шт.
                    </span>
                  </div>
                  <div className="order-item-prices">
                    <span className="order-item-unit">{fmtPrice(item.unit_price)}</span>
                    <span className="order-item-total">{fmtPrice(item.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-card-footer">
              <span className="order-total-label">Итого:</span>
              <span className="order-total-value">{fmtPrice(order.total_amount)}</span>
            </div>

            {order.status === 'pending' && !checkoutOrder && (
              <button
                className="order-checkout-btn"
                onClick={() => setCheckoutOrder(order.id)}
              >
                Перейти к оплате
              </button>
            )}
            {order.status === 'awaiting_payment' && !checkoutOrder && (
              <div className="order-awaiting-payment">
                <span>⏳ Ожидает оплаты</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {checkoutOrder && (
        <div className="orders-checkout-overlay">
          <div className="orders-checkout-container">
            <div className="orders-checkout-header">
              <h3>Оплата заказа #{checkoutOrder}</h3>
              <button className="orders-checkout-close" onClick={handleCancelCheckout}>
                ×
              </button>
            </div>
            <CheckoutForm
              totalAmount={orders.find(o => o.id === checkoutOrder)?.total_amount || 0}
              fmtPrice={fmtPrice}
              onCheckout={handleCheckout}
              onCancel={handleCancelCheckout}
            />
          </div>
        </div>
      )}

      {confirmedOrder && (
        <PaymentConfirmed order={confirmedOrder} onClose={handleCloseConfirmed} />
      )}
    </>
  );
}

export default OrdersList;
