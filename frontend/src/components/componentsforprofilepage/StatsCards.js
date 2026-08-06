// frontend/src/components/componentsforprofilepage/StatsCards.js
import '../../styles/components/profilecss/StatsCards.css';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const stats = [
  {
    label: 'Всего заказов',
    value: '284',
    delta: '+12%',
    up: true,
    icon: <span style={{ fontSize: '16px' }}>📦</span>,
    sub: 'за последние 30 дней',
  },
  {
    label: 'Потрачено',
    value: '₽ 123 400',
    delta: '+8.4%',
    up: true,
    icon: <span style={{ fontSize: '16px' }}>💳</span>,
    sub: 'в этом месяце',
  },
  {
    label: 'Бонусные баллы',
    value: '4 820',
    delta: '-2.1%',
    up: false,
    icon: <span style={{ fontSize: '16px' }}>⭐</span>,
    sub: 'доступно к списанию',
  },
  {
    label: 'Рейтинг',
    value: '4.9',
    delta: '+0.2',
    up: true,
    icon: <span style={{ fontSize: '16px' }}>📈</span>,
    sub: 'средняя оценка',
  },
];

function StatsCards() {
  return (
    <div className="profile-cards">
      {stats.map(s => (
        <div key={s.label} className="profile-stat-card">
          <div className="profile-stat-header">
            <p className="profile-stat-label">{s.label}</p>
            <div className="profile-stat-icon-wrap">{s.icon}</div>
          </div>
          <div>
            <p className="profile-stat-value">{s.value}</p>
            <div className="profile-stat-delta-row">
              {s.up ? <ArrowUpRight size={12} className="profile-stat-arrow up" /> : <ArrowDownRight size={12} className="profile-stat-arrow down" />}
              <span className={`profile-stat-delta ${s.up ? 'up' : 'down'}`}>{s.delta}</span>
              <span className="profile-stat-sub">{s.sub}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
