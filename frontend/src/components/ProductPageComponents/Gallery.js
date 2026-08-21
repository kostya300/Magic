import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../../styles/components/productPage/Gallery.css";

export default function Gallery({ product }) {
  const gallery = product?.gallery || [product?.image];
  const [activeImg, setActiveImg] = useState(0);

  const prev = () => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length);
  const next = () => setActiveImg((i) => (i + 1) % gallery.length);

  return (
    <div className="product-gallery">
      <div className="product-main-img">

        <img src={product.image_url || 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop&auto=format'}
          alt={product.name} />

        <div className="product-img-badges">
          {product?.badge && (
            <span className="product-img-badge hit">{product.badge}</span>
          )}
          {product?.discount > 0 && (
            <span className="product-img-badge discount">−{product.discount}%</span>
          )}
        </div>

        {gallery.length > 1 && (
          <>
            <button onClick={prev} className="product-nav-arrow prev">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="product-nav-arrow next">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="product-thumbnails">
          {gallery.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`product-thumb ${activeImg === i ? "active" : ""}`}
            >
              <img src={src} alt={`Фото ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
