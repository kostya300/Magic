import "../../styles/components/productPage/RelatedProducts.css";

function Stars({ rating, size = 10 }) {
  return (
    <div className="rp-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`rp-star ${i <= Math.round(rating) ? "rp-star-filled" : ""}`}
          style={{ fontSize: size }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function fmt(n) {
  return "₽ " + n.toLocaleString("ru");
}

export default function RelatedProducts({ products, onOpenProduct }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="rp-section">
      <h2 className="rp-title">Похожие товары</h2>
      <div className="rp-grid">
        {products.map((p) => (
          <div
            key={p.id}
            className="rp-card"
            onClick={() => onOpenProduct?.(p)}
          >
            <div className="rp-card-img">
              <img src={p.image} alt={p.imageAlt} />
              {p.discount > 0 && (
                <span className="rp-card-discount">−{p.discount}%</span>
              )}
            </div>
            <div className="rp-card-body">
              <p className="rp-card-category">{p.category}</p>
              <p className="rp-card-name">{p.name}</p>
              <div className="rp-card-footer">
                <p className="rp-card-price">{fmt(p.price)}</p>
                <Stars rating={p.rating} size={10} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
