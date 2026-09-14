// frontend/src/components/orderpagecomponentsjs/componentfororderlistjs/OrderDeleteButton.js
import '../../../styles/components/orderpagecomponentsstyles/componentfororderlistjsstyle/OrderDeleteButton.css';

function OrderDeleteButton({ orderId, onCancel }) {
  return (
    <button
      className="order-cancel-btn"
      onClick={() => onCancel()}
    >
      Отменить заказ
    </button>
  );
}

export default OrderDeleteButton;
