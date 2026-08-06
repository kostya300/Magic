// frontend/src/components/componentsforprofilepage/OrdersTable.js
import '../../styles/components/profilecss/OrdersTable.css';
import { ChevronRight } from 'lucide-react';

const orders = [
  { id: 'ORD-2847', product: 'Lenovo ThinkPad X1', date: '02 авг 2026', amount: '₽ 89 990', status: 'delivered', statusLabel: 'Доставлен' },
  { id: 'ORD-2831', product: 'Монитор LG 27UK850', date: '28 июл 2026', amount: '₽ 18 500', status: 'delivered', statusLabel: 'Доставлен' },
  { id: 'ORD-2798', product: 'Keychron Q1 Pro', date: '20 июл 2026', amount: '₽ 12 400', status: 'in-transit', statusLabel: 'В пути' },
  { id: 'ORD-2761', product: 'AirPods Pro 2', date: '10 июл 2026', amount: '₽ 24 990', status: 'delivered', statusLabel: 'Доставлен' },
];

function OrdersTable() {
  return (
    <div className="profile-orders">
      <div className="profile-orders-header">
        <h2 className="profile-orders-title">Последние заказы</h2>
        <button className="profile-orders-link">
          <span>Все заказы</span>
          <ChevronRight size={11} />
        </button>
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
            {orders.map(o => (
              <tr key={o.id}>
                <td className="profile-orders-order-id">{o.id}</td>
                <td>{o.product}</td>
                <td className="profile-orders-date">{o.date}</td>
                <td className="profile-orders-amount">{o.amount}</td>
                <td>
                  <span className={`profile-status-badge ${o.status}`}>{o.statusLabel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrdersTable;
