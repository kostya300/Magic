// frontend/src/components/orderpagecomponentsjs/componentfororderlistjs/DeliveryMethod.js
import '../../../styles/components/orderpagecomponentsstyles/componentfororderlistjsstyle/DeliveryMethod.css';

const deliveryMethods = [
  { id: 'address', label: 'Доставка по адресу', icon: '🚚' },
  { id: 'pickup', label: 'Пункт выдачи', icon: '📦' },
];

function DeliveryMethod({ selected, onChange }) {
  return (
    <div className="delivery-method">
      <p className="delivery-method-label">Способ доставки</p>
      <div className="delivery-method-options">
        {deliveryMethods.map((method) => (
          <label
            key={method.id}
            className={`delivery-method-option ${selected === method.id ? 'active' : ''}`}
          >
            <input
              type="radio"
              name="delivery"
              value={method.id}
              checked={selected === method.id}
              onChange={() => onChange(method.id)}
            />
            <span className="delivery-method-icon">{method.icon}</span>
            <span className="delivery-method-label-text">{method.label}</span>
            <span className="delivery-method-radio" />
          </label>
        ))}
      </div>
    </div>
  );
}

export default DeliveryMethod;
