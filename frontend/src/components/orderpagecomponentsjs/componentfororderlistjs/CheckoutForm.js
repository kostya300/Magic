// frontend/src/components/orderpagecomponentsjs/componentfororderlistjs/CheckoutForm.js
import { useState } from 'react';
import '../../../styles/components/orderpagecomponentsstyles/componentfororderlistjsstyle/CheckoutForm.css';
import PaymentMethod from './PaymentMethod';
import DeliveryMethod from './DeliveryMethod';

function CheckoutForm({ totalAmount, fmtPrice, onCheckout, onCancel }) {
  const [payment, setPayment] = useState('cash');
  const [delivery, setDelivery] = useState('address');
  const [address, setAddress] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (payment === 'cash' && delivery === 'address' && !address.trim()) {
      alert('Введите адрес доставки');
      return;
    }
    if (payment === 'cash' && delivery === 'pickup' && !pickupPoint.trim()) {
      alert('Укажите пункт выдачи');
      return;
    }

    setLoading(true);
    try {
      if (payment === 'yookassa') {
        // Для ЮKасса просто создаём заказ и перенаправляем на оплату
        await onCheckout({ payment, delivery, address, pickupPoint });
      } else {
        await onCheckout({ payment, delivery, address, pickupPoint });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-form">
      <PaymentMethod selected={payment} onChange={setPayment} />
      <DeliveryMethod selected={delivery} onChange={setDelivery} />

      {delivery === 'address' && (
        <div className="checkout-field">
          <label className="checkout-field-label">Адрес доставки</label>
          <textarea
            className="checkout-field-textarea"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Город, улица, дом, квартира"
            rows={3}
          />
        </div>
      )}

      {delivery === 'pickup' && (
        <div className="checkout-field">
          <label className="checkout-field-label">Пункт выдачи</label>
          <input
            className="checkout-field-input"
            value={pickupPoint}
            onChange={(e) => setPickupPoint(e.target.value)}
            placeholder="Название пункта выдачи"
          />
        </div>
      )}

      <div className="checkout-total">
        <span className="checkout-total-label">Итого к оплате:</span>
        <span className="checkout-total-value">{fmtPrice(totalAmount)}</span>
      </div>

      <div className="checkout-actions">
        <button
          type="button"
          className="checkout-btn-cancel"
          onClick={onCancel}
          disabled={loading}
        >
          Отмена
        </button>
        <button
          type="button"
          className={`checkout-btn-primary ${payment === 'cash' ? 'checkout-btn-cash' : ''}`}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Оформляем...' : (payment === 'cash' ? 'Оплатить при получении' : 'Перейти к оплате')}
        </button>
      </div>
    </div>
  );
}

export default CheckoutForm;
