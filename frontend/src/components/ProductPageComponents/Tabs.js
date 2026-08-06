import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import '../../styles/components/productPage/Tabs.css';

function Stars({ rating, size = 13 }) {
  return (
    <div className="tb-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`tb-star ${i <= Math.round(rating) ? "tb-star-filled" : ""}`}
          style={{ fontSize: size }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Tabs({ product }) {
  const [activeTab, setActiveTab] = useState("desc");

  const tabs = [
    { key: "desc", label: "Описание" },
    { key: "specs", label: "Характеристики" },
    { key: "reviews", label: `Отзывы (${product?.reviewList?.length || 0})` },
  ];

  return (
    <div className="tb-wrapper">
      <div className="tb-header">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tb-tab ${activeTab === tab.key ? "tb-tab-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Description */}
      {activeTab === "desc" && (
        <div className="tb-content tb-content-desc">
          <p className="tb-text">
            {product?.description || "Описание товара отсутствует."}
          </p>
        </div>
      )}

      {/* Specs */}
      {activeTab === "specs" && product?.specs && (
        <div className="tb-content tb-content-specs">
          <div className="tb-specs-grid">
            {product.specs.map((spec) => (
              <div key={spec.label} className="tb-spec-row">
                <span className="tb-spec-label">{spec.label}</span>
                <span className="tb-spec-value">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {activeTab === "reviews" && (
        <div className="tb-content tb-content-reviews">
          {product?.reviewList && product.reviewList.length > 0 ? (
            <div className="tb-reviews-list">
              {product.reviewList.map((r, i) => (
                <div key={i} className="tb-review-card">
                  <div className="tb-review-header">
                    <div>
                      <p className="tb-review-author">{r.author}</p>
                      <p className="tb-review-date">{r.date}</p>
                    </div>
                    <Stars rating={r.rating} size={13} />
                  </div>
                  <p className="tb-review-text">{r.text}</p>
                  <button className="tb-helpful-btn">
                    <ThumbsUp size={12} />
                    Полезно ({r.helpful})
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="tb-empty">
              <p className="tb-empty-text">Отзывов пока нет.</p>
              <p className="tb-empty-sub">Будьте первым, кто оставит отзыв!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
