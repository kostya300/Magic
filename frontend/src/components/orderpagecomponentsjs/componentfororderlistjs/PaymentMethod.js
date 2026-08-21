// frontend/src/components/orderpagecomponentsjs/componentfororderlistjs/PaymentMethod.js
import '../../../styles/components/orderpagecomponentsstyles/componentfororderlistjsstyle/PaymentMethod.css';

const paymentMethods = [
  { id: 'cash', label: 'Наличными при получении', icon: '💵' },
  { id: 'yookassa', label: 'ЮKassa', icon: '💳' },
];

function PaymentMethod({ selected, onChange }) {
  return (
    <div className="payment-method">
      <p className="payment-method-label">Способ оплаты</p>
      <div className="payment-method-options">
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            className={`payment-method-option ${selected === method.id ? 'active' : ''}`}
          >
            <input
              type="radio"
              name="payment"
              value={method.id}
              checked={selected === method.id}
              onChange={() => onChange(method.id)}
            />
            <span className="payment-method-icon">{method.icon}</span>
            <span className="payment-method-label-text">{method.label}</span>
            <span className="payment-method-radio" />
          </label>
        ))}
      </div>
    </div>
  );
}

export default PaymentMethod;
