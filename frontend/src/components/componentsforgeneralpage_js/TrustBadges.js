// frontend/src/components/componentsforgeneralpage_js/TrustBadges.js
import '../../styles/components/generalpagecss/TrustBadges.css';
import { Truck, Shield, RefreshCw, Bell } from 'lucide-react';

const items = [
  { icon: Truck, title: 'Быстрая доставка', sub: '1–3 дня по России' },
  { icon: Shield, title: 'Гарантия качества', sub: 'Официальная гарантия' },
  { icon: RefreshCw, title: 'Возврат 30 дней', sub: 'Без вопросов' },
  { icon: Bell, title: 'Поддержка 24/7', sub: 'Всегда на связи' },
];

function TrustBadges() {
  return (
    <section className="general-trust">
      {items.map(({ icon: Icon, title, sub }) => (
        <div key={title} className="general-trust-item">
          <div className="general-trust-icon">
            <Icon size={15} />
          </div>
          <div>
            <p className="general-trust-title">{title}</p>
            <p className="general-trust-sub">{sub}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default TrustBadges;
