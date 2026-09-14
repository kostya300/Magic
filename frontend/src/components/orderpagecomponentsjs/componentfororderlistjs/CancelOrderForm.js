// frontend/src/components/orderpagecomponentsjs/componentfororderlistjs/CancelOrderForm.js
import { useState } from 'react';
import { authFetch } from '../../../utils/authUtils';
import '../../../styles/components/orderpagecomponentsstyles/componentfororderlistjsstyle/CancelOrderForm.css';

const CANCELLATION_REASONS = [
  { id: 'changed_mind', label: 'Передумал' },
  { id: 'found_better', label: 'Нашёл дешевле' },
  { id: 'wrong_choice', label: 'Неправильно выбран товар' },
  { id: 'delivery_time', label: 'Неподходящие сроки доставки' },
  { id: 'price', label: 'Цена не устраивает' },
  { id: 'other', label: 'Другое' },
];

function CancelOrderForm({ orderId, onConfirm, onCancel, onUpdate }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const reason = selectedReason === 'other' ? otherReason : CANCELLATION_REASONS.find(r => r.id === selectedReason)?.label;
    if (!reason?.trim()) {
      alert('Выберите или введите причину отмены');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`/orders/${orderId}/cancel?reason=${encodeURIComponent(reason)}`, {
        method: 'PUT',
      });

      if (res.ok) {
        onConfirm();
        if (onUpdate) onUpdate();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.detail || 'Ошибка при отмене заказа');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Ошибка при отмене заказа');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="cancel-order-form">
      <h4 className="cancel-form-title">Отмена заказа #{orderId}</h4>
      <p className="cancel-form-subtitle">Выберите причину отмены:</p>

      <div className="cancel-reasons-list">
        {CANCELLATION_REASONS.map(reason => (
          <label key={reason.id} className="cancel-reason-item">
            <input
              type="radio"
              name="cancelReason"
              value={reason.id}
              checked={selectedReason === reason.id}
              onChange={() => {
                setSelectedReason(reason.id);
                setOtherReason('');
              }}
            />
            <span>{reason.label}</span>
          </label>
        ))}
      </div>

      {selectedReason === 'other' && (
        <div className="cancel-other-field">
          <textarea
            className="cancel-other-textarea"
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="Укажите причину..."
            rows={2}
          />
        </div>
      )}

      <div className="cancel-form-actions">
        <button
          type="button"
          className="cancel-btn-cancel"
          onClick={handleCancel}
          disabled={loading}
        >
          Отмена
        </button>
        <button
          type="button"
          className="cancel-btn-confirm"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Отменяем...' : 'Подтвердить отмену'}
        </button>
      </div>
    </div>
  );
}

export default CancelOrderForm;
