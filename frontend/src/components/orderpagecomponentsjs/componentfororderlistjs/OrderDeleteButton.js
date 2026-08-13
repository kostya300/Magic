// frontend/src/components/orderpagecomponentsjs/componentfororderlistjs/OrderDeleteButton.js
import { useState } from 'react';
import { X } from 'lucide-react';
import '../../../styles/components/orderpagecomponentsstyles/componentfororderlistjsstyle/OrderDeleteButton.css';

function OrderDeleteButton({ onConfirm }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (showConfirm) {
      onConfirm();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <button
      className={`order-delete-btn ${showConfirm ? 'confirm' : ''}`}
      onClick={handleDelete}
      title={showConfirm ? 'Подтвердите ещё раз' : 'Удалить заказ'}
    >
      <X size={16} />
      {showConfirm && <span className="order-delete-confirm">!</span>}
    </button>
  );
}

export default OrderDeleteButton;
