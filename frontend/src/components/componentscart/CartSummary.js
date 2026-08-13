import { TrendingUp, ShoppingCart } from 'lucide-react';
import '../../styles/components/componentscart/CartSummary.css';

function fmt(n) {
  return '₽ ' + Math.round(n).toLocaleString('ru');
}

export default function CartSummary({ items, totalQty, totalPrice, onCheckout, onClear }) {
  const delivery = totalPrice >= 5000 ? 0 : 500;
  const finalTotal = totalPrice + delivery;

  return (
    <div className="cart-summary">
      <h3 className="cart-summary-title">Итого</h3>

      <div className="cart-summary-items">
        <div className="cart-summary-row">
          <span>Товары ({totalQty})</span>
          <span>{fmt(totalPrice)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Доставка</span>
          <span className={delivery === 0 ? 'cart-free' : ''}>
            {delivery === 0 ? 'Бесплатно' : fmt(delivery)}
          </span>
        </div>
        <div className="cart-summary-divider" />
        <div className="cart-summary-row cart-summary-total">
          <span>К оплате</span>
          <span>{fmt(finalTotal)}</span>
        </div>
      </div>

      {delivery > 0 && (
        <p className="cart-summary-hint">
          Бесплатная доставка от ₽ 5 000. До бесплатной доставки не хватает: {fmt(5000 - totalPrice)}
        </p>
      )}

      <button className="cart-checkout-btn" onClick={onCheckout}>
        <ShoppingCart size={16} />
        Оформить заказ
      </button>

      <button className="cart-clear-btn" onClick={onClear}>
        Очистить корзину
      </button>
    </div>
  );
}
