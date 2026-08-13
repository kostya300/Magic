import { X, Plus, Minus } from 'lucide-react';
import '../../styles/components/componentscart/CartItem.css';

function fmt(n) {
  return '₽ ' + Math.round(n).toLocaleString('ru');
}

export default function CartItem({ item, onUpdateQty, onRemove }) {
  const { product, quantity, id } = item;
  const itemTotal = product.price * quantity;

  const handleInc = () => {
    if (quantity >= product.stock) return;
    onUpdateQty(item.product.id, quantity + 1);
  };

  const handleDec = () => {
    if (quantity <= 1) {
      onRemove(item.product.id);
    } else {
      onUpdateQty(item.product.id, quantity - 1);
    }
  };

  return (
    <div className="cart-item">
      <div className="cart-item-img-wrap">
        <img
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          className="cart-item-img"
        />
      </div>

      <div className="cart-item-body">
        <h3 className="cart-item-name">{product.name}</h3>
        <p className="cart-item-price">{fmt(product.price)}</p>
      </div>

      <div className="cart-item-qty">
        <div className="cart-item-qty-control">
          <button onClick={handleDec} className="cart-qty-btn">
            {quantity <= 1 ? <X size={14} /> : <Minus size={14} />}
          </button>
          <span className="cart-qty-num">{quantity}</span>
          <button
            onClick={handleInc}
            disabled={quantity >= product.stock}
            className="cart-qty-btn"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="cart-item-total">
        {fmt(itemTotal)}
      </div>

      <button onClick={() => onRemove(item.product.id)} className="cart-item-remove">
        <X size={16} />
      </button>
    </div>
  );
}
