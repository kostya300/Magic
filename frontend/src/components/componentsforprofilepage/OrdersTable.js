// frontend/src/components/componentsforprofilepage/OrdersTable.js
import { useEffect, useState } from 'react';
import { authFetch, clearAuthTokens } from '../../utils/authUtils';
import '../../styles/components/profilecss/OrdersTable.css';
import { ChevronRight } from 'lucide-react';

const statusLabels = {
  pending: 'Ожидает обработки',
  confirmed: 'Подтверждён',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await authFetch('/orders/?page=1&page_size=5');
      if (res.status === 401) {
        clearAuthTokens();
        return;
      }
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setOrders(data.items || []);
    } catch (err) {
      console.error('Orders load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const fmtDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const fmtAmount = (amount) => {
    return `₽ ${Number(amount).toLocaleString('ru')}`;
  };

  if (loading) return <div className="profile-orders">Загрузка...</div>;

  return (
    <div className="profile-orders">
      <div className="profile-orders-header">
        <h2 className="profile-orders-title">Последние заказы</h2>
      </div>
      <div className="profile-orders-table-wrap">
        <table className="profile-orders-table">
          <thead>
            <tr>
              {['Номер', 'Товар', 'Дата', 'Сумма', 'Статус'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const firstItem = o.items?.[0];
              return (
                <tr key={o.id}>
                  <td className="profile-orders-order-id">#{o.id}</td>
                  <td>{firstItem?.product?.name || '—'}</td>
                  <td className="profile-orders-date">{fmtDate(o.created_at)}</td>
                  <td className="profile-orders-amount">{fmtAmount(o.total_amount)}</td>
                  <td>
                    <span
                      className={`profile-status-badge profile-status-${o.status}`}
                      style={{ color: { pending: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' }[o.status] || '#6b7280' }}
                    >
                      {statusLabels[o.status] || o.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  Заказов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrdersTable;
