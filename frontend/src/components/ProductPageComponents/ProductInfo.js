import { useState, useEffect } from "react";
import {
  Shield,
  Truck,
  RefreshCw,
  ArrowLeft,
  Check,
  Plus,
  Minus,
  Heart,
  Share2,
  ShoppingCart,
  Headphones,
} from "lucide-react";
import "../../styles/components/productPage/ProductInfo.css";

function Stars({ rating, size = 14 }) {
  return (
    <div className="pi-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`pi-star ${i <= Math.round(rating) ? "pi-star-filled" : ""}`}
          style={{ fontSize: size }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ProductInfo({ product, qtyRef, onAddToCart, onBuyNow }) {
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);

  const fmt = (n) => "₽ " + n.toLocaleString("ru");

  useEffect(() => {
    if (qtyRef) qtyRef.current = qty;
  }, [qty, qtyRef]);

    const handleAdd = () => {
    console.log('🛒 Кнопка "В корзину" нажата');
    console.log('📦 Количество:', qty);
    console.log('📦 Товар:', product);

    setAdded(true);

    // Проверяем, что onAddToCart - это функция
    if (typeof onAddToCart === 'function') {
      console.log('✅ onAddToCart - функция, вызываем...');
      onAddToCart(qty);
    } else {
      console.error('❌ onAddToCart НЕ является функцией!', onAddToCart);
    }

    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-info-panel">
      {/* Title */}
      <div className="pi-title-block">
        <p className="pi-category">{product.category}</p>
        <h1 className="pi-name">{product.name}</h1>
        <div className="pi-meta">
          <Stars rating={product.rating} />
          <span className="pi-rating-text">
            {product.rating} · {product.reviews} отзывов
          </span>
          <span
            className={`pi-status ${product.inStock ? "pi-status-in" : "pi-status-out"}`}
          >
            {product.inStock ? "● В наличии" : "● Нет в наличии"}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="pi-price-block">
        <span className="pi-price-main">{fmt(product.price)}</span>
        {product.oldPrice && (
          <>
            <span className="pi-price-old">{fmt(product.oldPrice)}</span>
            <span className="pi-price-savings">Выгода {fmt(product.oldPrice - product.price)}</span>
          </>
        )}
      </div>

      {/* Color selector */}
      {product.colors && product.colors.length > 0 && (
        <div className="pi-option-group">
          <p className="pi-option-label">
            Цвет:{" "}
            <span className="pi-option-value">{product.colors[selectedColor]}</span>
          </p>
          <div className="pi-chips">
            {product.colors.map((c, i) => (
              <button
                key={c}
                onClick={() => setSelectedColor(i)}
                className={`pi-chip ${selectedColor === i ? "pi-chip-active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Storage selector */}
      {product.storageOptions && product.storageOptions.length > 0 && (
        <div className="pi-option-group">
          <p className="pi-option-label">Объём памяти</p>
          <div className="pi-chips">
            {product.storageOptions.map((opt, i) => (
              <button
                key={opt}
                onClick={() => setSelectedStorage(i)}
                className={`pi-chip ${selectedStorage === i ? "pi-chip-active" : ""}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Qty */}
      <div className="pi-qty-row">
        <p className="pi-option-label">Количество</p>
        <div className="pi-qty-control">

          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            onMouseDown={(e) => e.preventDefault()}
            className="pi-qty-btn"
            disabled={qty <= 1 || !product.inStock}
          >
            <Minus size={13} />
          </button>
          <span className="pi-qty-num">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            onMouseDown={(e) => e.preventDefault()}
            className="pi-qty-btn"
            disabled={!product.inStock}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="pi-actions">
        <button
          onClick={handleAdd}
          disabled={!product.inStock}
          className={`pi-btn-cart ${added ? "pi-btn-cart-added" : ""} ${
            !product.inStock ? "pi-btn-cart-disabled" : ""
          }`}
        >
          {added ? (
            <><Check size={15} /> Добавлено в корзину</>
          ) : (
            <><ShoppingCart size={15} /> В корзину</>
          )}
        </button>
        <button
          onClick={() => setWished(!wished)}
          className={`pi-icon-btn ${wished ? "pi-icon-btn-wished" : ""}`}
        >
          <Heart size={16} className={wished ? "pi-heart-filled" : ""} />
        </button>
        <button className="pi-icon-btn">
          <Share2 size={16} />
        </button>
      </div>

      <button
        disabled={!product.inStock}
        className="pi-btn-buy"
        onClick={() => {
          if (onBuyNow) {
            onBuyNow();
          } else {
            qtyRef.current = qty;
            onAddToCart(qty);
          }
        }}
      >
        Купить сейчас
      </button>

      {/* Delivery guarantees */}
      <div className="pi-guarantees">
        {[
          { icon: Truck, text: "Доставка 1–3 дня · Бесплатно от ₽ 5 000" },
          { icon: RefreshCw, text: "Возврат в течение 30 дней" },
          { icon: Shield, text: "Официальная гарантия 12 месяцев" },
          { icon: Headphones, text: "Поддержка 24/7 по телефону и чату" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="pi-guarantee-item">
            <Icon size={13} className="pi-guarantee-icon" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}