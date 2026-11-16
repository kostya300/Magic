import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import '../../styles/components/productPage/Tabs.css';

function Stars({ rating, size = 13, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="tb-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`tb-star ${i <= (interactive ? (hovered || rating) : Math.round(rating)) ? "tb-star-filled" : ""}`}
          style={{ fontSize: size, cursor: interactive ? "pointer" : "default" }}
          onClick={() => interactive && onRate && onRate(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Tabs({ product, reviewList = [], onReviewAdded }) {
  const [activeTab, setActiveTab] = useState("desc");
  const [grade, setGrade] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleRate = (value) => {
    setGrade(value);
  };

  const handleSubmit = async () => {
    if (grade === 0) {
      setSubmitError("Поставьте оценку");
      return;
    }
    if (!comment.trim()) {
      setSubmitError("Напишите отзыв");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/reviews/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          grade,
          comment: comment.trim(),
        }),
      });

      if (res.ok) {
        const newReview = await res.json();
        setGrade(0);
        setComment("");
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
        if (onReviewAdded) onReviewAdded(newReview.rating);
      } else {
        const data = await res.json();
        setSubmitError(data.detail || "Ошибка при отправке отзыва");
      }
    } catch (err) {
      setSubmitError("Не удалось отправить отзыв");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const tabs = [
    { key: "desc", label: "Описание" },
    { key: "specs", label: "Характеристики" },
    { key: "reviews", label: `Отзывы (${reviewList.length})` },
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
          {/* Review form */}
          <div className="tb-review-form">
            <h3 className="tb-review-form-title">Оставить отзыв</h3>

            {submitSuccess && (
              <div className="tb-review-success">
                Спасибо! Ваш отзыв успешно отправлен.
              </div>
            )}

            {submitError && (
              <div className="tb-review-error">{submitError}</div>
            )}

            <div className="tb-review-form-row">
              <span className="tb-review-form-label">Ваша оценка:</span>
              <Stars rating={grade} interactive onRate={handleRate} size={24} />
            </div>

            <textarea
              className="tb-review-form-textarea"
              placeholder="Напишите ваш отзыв о товаре..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />

            <button
              className="tb-review-form-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Отправка..." : "Отправить"}
            </button>
          </div>

          {/* Reviews list */}
          {reviewList.length > 0 ? (
            <div className="tb-reviews-list">
              {reviewList.map((r) => (
                <div key={r.id} className="tb-review-card">
                  <div className="tb-review-header">
                    <div>
                      <p className="tb-review-author">
                        {r.user_id || "Пользователь"}
                      </p>
                      <p className="tb-review-date">{formatDate(r.comment_date)}</p>
                    </div>
                    <Stars rating={r.grade} size={13} />
                  </div>
                  <p className="tb-review-text">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="tb-empty">
              <p className="tb-empty-text">Отзывов пока нет.</p>
              <p className="tb-empty-sub">
                Будьте первым, кто оставит отзыв!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
