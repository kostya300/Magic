// frontend/src/pages/Ordersgeneral.js
import { useState, useEffect } from 'react';
import { isAuthenticated, authFetch, clearAuthTokens } from '../utils/authUtils';
import '../styles/components/orderpagecomponentsstyles/Ordersgeneral.css';
import OrdersList from '../components/orderpagecomponentsjs/OrdersList';

function Ordersgeneral() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const loadOrders = async (pageNum = 1) => {
    try {
      const res = await authFetch(`/orders/?page=${pageNum}&page_size=${pageSize}`);
      if (res.status === 401) {
        clearAuthTokens();
        setError('Сессия истекла');
        setLoading(false);
        window.location.replace('/login');
        return;
      }
      if (!res.ok) throw new Error('Ошибка загрузки заказов');
      const data = await res.json();
      setOrders(data.items || []);
      setTotal(data.total || 0);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      loadOrders(1);
    }
  }, []);

  const handlePageChange = (newPage) => {
    loadOrders(newPage);
  };



  if (loading) return (
    <div className="orders-page">
      <div className="orders-loading">Загрузка заказов...</div>
    </div>
  );

  if (error) return (
    <div className="orders-page">
      <div className="orders-error">
        <p>{error}</p>
        <button onClick={() => window.location.replace('/login')}>Войти</button>
      </div>
    </div>
  );

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1 className="orders-title">Мои заказы</h1>
        <p className="orders-subtitle">Всего заказов: {total}</p>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <p>У вас пока нет заказов</p>
        </div>
      ) : (
        <OrdersList orders={orders} />
      )}

      {total > pageSize && (
        <div className="orders-pagination">
          <button
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="orders-page-btn"
          >
            ← Назад
          </button>
          <span className="orders-page-info">
            Страница {page} из {Math.ceil(total / pageSize)}
          </span>
          <button
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => handlePageChange(page + 1)}
            className="orders-page-btn"
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}

export default Ordersgeneral;
