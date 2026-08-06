// frontend/src/components/componentsforgeneralpage_js/Promo.js
import '../../styles/components/generalpagecss/Promo.css';
import { TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

function Promo() {
  return (
    <section className="general-promo-grid">
      {/* Promo 1 */}
      <div className="general-promo general-promo-1">
        <div>
          <span className="general-promo-tag" style={{ color: '#4f8ef7' }}>
            <TrendingUp size={12} />
            Сезонная акция
          </span>
          <h3 className="general-promo-title">Скидки до 30%</h3>
          <p className="general-promo-sub">на всю линейку Samsung Galaxy</p>
        </div>
        <button className="general-promo-btn accent">
          Перейти в раздел <ArrowRight size={12} />
        </button>
        <div className="general-promo-emoji">📱</div>
      </div>

      {/* Promo 2 */}
      <div className="general-promo general-promo-2">
        <div>
          <span className="general-promo-tag" style={{ color: '#10b981' }}>
            <Sparkles size={12} />
            Новинки недели
          </span>
          <h3 className="general-promo-title">Apple Watch Ultra 2</h3>
          <p className="general-promo-sub">Первыми получите + кэшбэк 5%</p>
        </div>
        <button className="general-promo-btn success">
          Заказать сейчас <ArrowRight size={12} />
        </button>
        <div className="general-promo-emoji">⌚</div>
      </div>
    </section>
  );
}

export default Promo;
