// frontend/src/components/orderpagecomponentsjs/OrdersList.js
import { useState } from 'react';
import OrderDeleteButton from './componentfororderlistjs/OrderDeleteButton';
import CheckoutForm from './componentfororderlistjs/CheckoutForm';
import PaymentConfirmed from './componentfororderlistjs/PaymentConfirmed';
import '../../styles/components/orderpagecomponentsstyles/OrdersList.css';

function OrdersList({ orders }) {
  const [checkoutOrder, setCheckoutOrder] = useState(null);

  const fmtPrice = (price) => `₽ ${Number(price).toLocaleString('ru')}`;
  const getStatusLabel = (status) => {
    const labels = { pending: 'Ожидает обработки', confirmed: 'Подтверждён', shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменён' };
    return labels[status] || status;
  };
  const getStatusColor = (status) => {
    const colors = { pending: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };
    return colors[status] || '#6b7280';
  };
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [deleteOrderId, setDeleteOrderId] = useState(null);

  const handleDelete = async (orderId) => {
    setDeleteOrderId(orderId);
    try {
      const res = await fetch(`/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCheckout = async (data) => {
    try {
      const res = await fetch('/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (res.ok) {
        const order = await res.json();
        setConfirmedOrder(order);
        setCheckoutOrder(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const handleCancelCheckout = () => setCheckoutOrder(null);
  const handleCloseConfirmed = () => {
    setConfirmedOrder(null);
    window.location.reload();
  };

  return (
    <>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <OrderDeleteButton onConfirm={() => handleDelete(order.id)} />

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
                Оформить заказ
              </button>
            )}
          </div>
        ))}
      </div>

      {checkoutOrder && (
        <div className="orders-checkout-overlay">
          <div className="orders-checkout-container">
            <div className="orders-checkout-header">
              <h3>Оформление заказа #{checkoutOrder}</h3>
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
