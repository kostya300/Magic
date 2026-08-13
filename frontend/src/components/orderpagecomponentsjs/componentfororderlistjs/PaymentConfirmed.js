// frontend/src/components/orderpagecomponentsjs/componentfororderlistjs/PaymentConfirmed.js
import { Check } from 'lucide-react';
import '../../../styles/components/orderpagecomponentsstyles/componentfororderlistjsstyle/PaymentConfirmed.css';

function PaymentConfirmed({ order, onClose }) {
  return (
    <div className="payment-confirmed-overlay">
      <div className="payment-confirmed-card">
        <div className="payment-confirmed-icon">
          <Check size={40} />
        </div>
        <h3 className="payment-confirmed-title">Заказ оформлен!</h3>
        <p className="payment-confirmed-message">
          Заказ <strong>#{order.id}</strong> успешно оплачен при получении
        </p>
        <p className="payment-confirmed-status">Статус: <span className="payment-confirmed-status-delivered">Доставлен</span></p>
        <button className="payment-confirmed-btn" onClick={onClose}>
          Перейти к заказам
        </button>
      </div>
    </div>
  );
}

export default PaymentConfirmed;
