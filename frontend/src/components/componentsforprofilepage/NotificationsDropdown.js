// frontend/src/components/componentsforprofilepage/NotificationsDropdown.js
import { useState, useEffect } from 'react';
import { authFetch } from '../../utils/authUtils';
import '../../styles/components/profilecss/NotificationsDropdown.css';

const NOTIFICATION_TYPES = {
  ORDER_CREATED: { label: 'Заказ создан', icon: '📦', color: '#4f8ef7' },
  ORDER_CANCELLED: { label: 'Заказ отменён', icon: '❌', color: '#ef4444' },
  ORDER_PAID: { label: 'Заказ оплачен', icon: '✅', color: '#10b981' },
  ORDER_SHIPPED: { label: 'Заказ отправлен', icon: '🚚', color: '#8b5cf6' },
  ORDER_DELIVERED: { label: 'Заказ доставлен', icon: '📬', color: '#10b981' },
};

function NotificationsDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/orders/?page=1&page_size=10');
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        
        const notifs = items.map(order => {
          let type = 'ORDER_CREATED';
          if (order.status === 'cancelled') type = 'ORDER_CANCELLED';
          else if (order.status === 'paid') type = 'ORDER_PAID';
          else if (order.status === 'shipped') type = 'ORDER_SHIPPED';
          else if (order.status === 'delivered') type = 'ORDER_DELIVERED';
          
          return {
            id: order.id,
            type,
            message: `${NOTIFICATION_TYPES[type].label} #${order.id}`,
            date: order.created_at,
            icon: NOTIFICATION_TYPES[type].icon,
            color: NOTIFICATION_TYPES[type].color,
          };
        });
        
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <h4 className="notifications-title">Уведомления</h4>
        <button className="notifications-clear-btn" onClick={onClose}>
          Закрыть
        </button>
      </div>
      
      <div className="notifications-list">
        {loading ? (
          <div className="notifications-loading">Загрузка...</div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <p>Нет уведомлений</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="notification-item">
              <div className="notification-icon" style={{ color: notif.color }}>
                {notif.icon}
              </div>
              <div className="notification-content">
                <p className="notification-text">{notif.message}</p>
                <span className="notification-date">
                  {new Date(notif.date).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsDropdown;
