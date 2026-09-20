// frontend/src/components/componentsforprofilepage/StatsCards.js
import { useNavigate } from 'react-router-dom';
import '../../styles/components/profilecss/StatsCards.css';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

function StatsCards({ orders = [], totalSpent = 0 }) {
  const navigate = useNavigate();

  // Вычисляем статистику из реальных данных
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => ['paid', 'delivered', 'shipped'].includes(o.status)).length;

  const fmtCurrency = (amount) => `₽ ${Number(amount).toLocaleString('ru')}`;

  const stats = [
    {
      label: 'Всего заказов',
      value: totalOrders,
      delta: `${pendingOrders} ожидает`,
      up: true,
      icon: <span style={{ fontSize: '16px' }}>📦</span>,
      sub: 'всего заказов',
      onClick: () => navigate('/orders'),
    },
    {
      label: 'Потрачено',
      value: fmtCurrency(totalSpent),
      delta: '',
      up: true,
      icon: <span style={{ fontSize: '16px' }}>💳</span>,
      sub: 'общая сумма',
      onClick: () => navigate('/orders'),
    },
    {
      label: 'Завершённые',
      value: completedOrders,
      delta: '',
      up: true,
      icon: <span style={{ fontSize: '16px' }}>✅</span>,
      sub: 'выполнено',
      onClick: () => navigate('/orders'),
    },
    {
      label: 'Ожидают оплаты',
      value: pendingOrders,
      delta: '',
      up: false,
      icon: <span style={{ fontSize: '16px' }}>⏳</span>,
      sub: 'требуют внимания',
      onClick: () => navigate('/orders'),
    },
  ];

  return (
    <div className="profile-cards">
      {stats.map((s, index) => (
        <div
          key={s.label}
          className="profile-stat-card"
          onClick={s.onClick}
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <div className="profile-stat-header">
            <p className="profile-stat-label">{s.label}</p>
            <div className="profile-stat-icon-wrap">{s.icon}</div>
          </div>
          <div>
            <p className="profile-stat-value">{s.value}</p>
            {s.delta && (
              <div className="profile-stat-delta-row">
                {s.up ? (
                  <ArrowUpRight size={12} className="profile-stat-arrow up" />
                ) : (
                  <ArrowDownRight size={12} className="profile-stat-arrow down" />
                )}
                <span className={`profile-stat-delta ${s.up ? 'up' : 'down'}`}>
                  {s.delta}
                </span>
              </div>
            )}
            <span className="profile-stat-sub">{s.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
