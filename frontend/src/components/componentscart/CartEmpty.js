import { ShoppingCart } from 'lucide-react';
import '../../styles/components/componentscart/CartEmpty.css';

export default function CartEmpty({ onGoHome }) {
  return (
    <div className="cart-empty">
      <div className="cart-empty-icon">
        <ShoppingCart size={64} />
      </div>
      <h2 className="cart-empty-title">Корзина пуста</h2>
      <p className="cart-empty-text">
        Добавьте товары из каталога, чтобы оформить заказ
      </p>
      <button onClick={onGoHome} className="cart-empty-btn">
        Перейти в каталог
      </button>
    </div>
  );
}
